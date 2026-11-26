package report

import (
	"strings"
	"testing"

	"github.com/Autumn-27/artex/db"
)

func TestMarkdownDisclosesTruncatedFindings(t *testing.T) {
	in := Input{Findings: []*db.Node{reportNode(1, "high", "Visible finding")}, FindingsTruncated: true}
	md := Markdown(in)
	if !strings.Contains(md, "Showing the latest **1** confirmed findings. Older findings are omitted.") {
		t.Fatalf("missing finding limit disclosure:\n%s", md)
	}
	in.FindingsTruncated = false
	if md := Markdown(in); strings.Contains(md, "Older findings are omitted.") {
		t.Fatalf("complete report incorrectly described as truncated:\n%s", md)
	}
}
