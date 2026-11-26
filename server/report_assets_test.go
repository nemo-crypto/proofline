package server

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/Autumn-27/artex/db"
)

func TestReportCountsOnlyAssetsLinkedToItsTask(t *testing.T) {
	skipWithoutDSN(t)
	dsn, _, err := db.DSN()
	if err != nil {
		t.Fatal(err)
	}
	pg, err := db.Open(dsn)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { pg.Close() })
	taskID, err := pg.CreateExploration("Report asset counts", "")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _, _ = pg.Exec("DELETE FROM explorations WHERE id=$1", taskID) })
	assets := pg.Assets()
	for i, owner := range []int64{taskID, 0} {
		domain := fmt.Sprintf("proofline-report-%d-%d.example", taskID, i)
		id, err := assets.UpsertRootDomain(db.UpsertRootDomainReq{Domain: domain, TaskID: owner})
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { _, _ = pg.Exec("DELETE FROM assets WHERE id=$1", id) })
	}
	id := strconv.FormatInt(taskID, 10)
	s := &Server{m: &Manager{pg: pg, assets: assets, tasks: map[string]*Task{
		id: {ID: id, Store: pg.Exploration(taskID)},
	}}}
	w := httptest.NewRecorder()
	s.getReport(w, httptest.NewRequest(http.MethodGet, "/api/report?task="+id, nil))
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), "- Assets: root_domain 1\n") {
		t.Fatalf("expected only the task's root-domain asset, got %d %s", w.Code, w.Body.String())
	}
}
