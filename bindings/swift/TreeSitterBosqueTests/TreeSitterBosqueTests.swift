import XCTest
import SwiftTreeSitter
import TreeSitterBosque

final class TreeSitterBosqueTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_bosque())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Bosque grammar")
    }
}
