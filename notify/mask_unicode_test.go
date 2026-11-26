package notify

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestMaskedValueHandlesUnicodeCredentialHints(t *testing.T) {
	if got := MaskedValue("甲乙丙"); got != MaskedPrefix {
		t.Fatalf("a three-character credential must give no hint")
	}
	if got := MaskedValue("一二三四五六七八"); !utf8.ValidString(got) || !strings.HasSuffix(got, "三四五六七八") {
		t.Fatal("expected a valid six-character suffix")
	}
}
