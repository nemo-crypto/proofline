package server

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Autumn-27/artex/db"
)

func TestReportFailsWhenFindingsCannotBeRead(t *testing.T) {
	conn, err := sql.Open("pgx", "")
	if err != nil {
		t.Fatal(err)
	}
	if err := conn.Close(); err != nil {
		t.Fatal(err)
	}
	pg := &db.DB{DB: conn}
	s := &Server{m: &Manager{assets: pg.Assets(), tasks: map[string]*Task{
		"1": {ID: "1", Store: pg.Exploration(1)},
	}}}
	w := httptest.NewRecorder()
	s.getReport(w, httptest.NewRequest(http.MethodGet, "/api/report?task=1", nil))
	if w.Code != http.StatusInternalServerError || !strings.Contains(w.Body.String(), "findings could not be loaded") {
		t.Fatalf("expected a report findings read error, got %d %s", w.Code, w.Body.String())
	}
}
