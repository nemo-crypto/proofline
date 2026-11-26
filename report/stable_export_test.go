package report

import (
	"bytes"
	"github.com/Autumn-27/artex/db"
	"testing"
	"time"
)

func TestFindingsExportsWithTiedTimestamps(t *testing.T) {
	first := &db.DBFinding{ID: 10, Severity: "high", Name: "First"}
	second := &db.DBFinding{ID: 11, Severity: "high", Name: "Second"}
	a, b := []*db.DBFinding{first, second}, []*db.DBFinding{second, first}
	if !bytes.Equal(FindingsCSV(a), FindingsCSV(b)) {
		t.Fatal("CSV changed when input order changed")
	}
	if FindingsMarkdown(a, time.Time{}) != FindingsMarkdown(b, time.Time{}) {
		t.Fatal("Markdown changed when input order changed")
	}
}
