package report

import (
	"github.com/Autumn-27/artex/db"
	"strings"
	"testing"
	"time"
)

func TestMarkdownHeadingStaysOnOneLine(t *testing.T) {
	name := "First line\r\n second line"
	finding := &db.DBFinding{Name: name}
	for _, out := range []string{Markdown(Input{Title: name}), FindingsMarkdown([]*db.DBFinding{finding}, time.Time{}), SingleFindingMarkdown(finding, time.Time{})} {
		if !strings.Contains(out, "First line second line\n") {
			t.Fatalf("expected single line heading, got %q", out)
		}
	}
}
