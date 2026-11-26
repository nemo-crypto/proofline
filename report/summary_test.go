package report

import (
	"strings"
	"testing"
	"time"

	"github.com/Autumn-27/artex/db"
)

func TestFindingsMarkdownSummaryAccountsForEveryFinding(t *testing.T) {
	findings := []*db.DBFinding{{}, {}, {}, {}, {}}
	for i, severity := range []string{" HIGH ", "high", "info", "", "custom"} {
		findings[i].Severity = severity
	}
	markdown := FindingsMarkdown(findings, time.Unix(0, 0))
	for _, row := range []string{"Total findings**: 5", "| High | 2 |", "| Info / other | 3 |"} {
		if !strings.Contains(markdown, row) {
			t.Errorf("missing summary entry %q", row)
		}
	}
}
