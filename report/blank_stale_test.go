package report

import "testing"

func TestWhitespaceOnlyReportIsNotStale(t *testing.T) {
	q := Quality{Report: " \n\t", EvidenceVersion: 3, ReportEvidenceVersion: 1}
	if q.ReportStale() {
		t.Fatal("whitespace should not trigger a stale report warning")
	}
}
