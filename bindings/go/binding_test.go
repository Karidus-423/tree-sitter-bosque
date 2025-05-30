package tree_sitter_bosque_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_bosque "github.com/karidus-423/tree-sitter-bosque/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_bosque.Language())
	if language == nil {
		t.Errorf("Error loading Bosque grammar")
	}
}
