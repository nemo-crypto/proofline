package report

import (
	"github.com/Autumn-27/artex/db"
	"testing"
)

func TestFindingTitleTrimsWhitespace(t *testing.T) {
	for _, tc := range []struct{ name, class, want string }{
		{"  Name  ", " Class ", "Name"},
		{" \t", " Class ", "Class"},
		{" ", " \n", "Uncategorized"},
	} {
		if got := findingTitle(&db.DBFinding{Name: tc.name, VulnClass: tc.class}); got != tc.want {
			t.Errorf("title = %q, want %q", got, tc.want)
		}
	}
}
