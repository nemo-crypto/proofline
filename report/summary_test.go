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

func TestMarkdownAssetSummary(t *testing.T) {
	for _, tc := range []struct {
		name   string
		counts map[string]int
		want   string
	}{
		{"missing counts", nil, "- Assets: 0 recorded\n"},
		{"empty counts", map[string]int{}, "- Assets: 0 recorded\n"},
		{"recorded counts", map[string]int{"url": 3, "host": 2}, "- Assets: host 2, url 3\n"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got := Markdown(Input{AssetCounts: tc.counts})
			if !strings.Contains(got, tc.want) {
				t.Errorf("missing %q in report:\n%s", tc.want, got)
			}
		})
	}
}

func TestMarkdownExportsUseUTCTimestamps(t *testing.T) {
	generatedAt := time.Date(2026, 11, 26, 20, 0, 5, 0, time.FixedZone("UTC+8", 8*3600))
	finding := &db.DBFinding{}
	for name, markdown := range map[string]string{
		"task":           Markdown(Input{GeneratedAt: generatedAt}),
		"findings":       FindingsMarkdown([]*db.DBFinding{finding}, generatedAt),
		"single finding": SingleFindingMarkdown(finding, generatedAt),
	} {
		if !strings.Contains(markdown, "- **Generated at**: 2026-11-26T12:00:05Z\n") {
			t.Errorf("%s export lost the UTC timestamp", name)
		}
	}
}
