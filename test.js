const assert = require('assert');
const textUtil = require('./text_util');

const runTests = () => {
    const results = [];

    const addResult = (name, passed, error) => {
        results.push({ name, passed, error });
    };

    // Test analyzeText
    try {
        const textAnalysis = textUtil.analyzeText("Hello, world! This is a test.");
        assert.strictEqual(textAnalysis.spaceCount, 5);
        assert.strictEqual(textAnalysis.fullStopCount, 1);
        assert.strictEqual(textAnalysis.semicolonCount, 0);
        assert.strictEqual(textAnalysis.squareBracketCount, 0);
        assert.strictEqual(textAnalysis.colonCount, 0);
        assert.strictEqual(textAnalysis.doubleQuoteCount, 0);
        assert.strictEqual(textAnalysis.curlyBracketCount, 0);
        //assert.strictEqual(textAnalysis.otherPunctuationCount, 1);
        addResult('analyzeText', true);
    } catch (error) {
        addResult('analyzeText', false, error);
    }

    // Test indicate_is_computer_language
    try {
        const isComputerLanguage = textUtil.indicate_is_computer_language("function test() { return true; }");
        assert.strictEqual(isComputerLanguage, true);
        addResult('indicate_is_computer_language', true);
    } catch (error) {
        addResult('indicate_is_computer_language', false, error);
    }

    // Test get_html_document_text_nodes
    try {
        const html = '<html><body><p>Hello, world!</p></body></html>';
        const textNodes = textUtil.get_html_document_text_nodes(html, 1);
        assert.strictEqual(textNodes.length, 1);
        assert.strictEqual(textNodes[0].value, 'Hello, world!');
        addResult('get_html_document_text_nodes', true);
    } catch (error) {
        addResult('get_html_document_text_nodes', false, error);
    }

    // Test get_html_document_a_elements
    try {
        const htmlWithLinks = '<html><body><a href="https://example.com">Example</a></body></html>';
        const aElements = textUtil.get_html_document_a_elements(htmlWithLinks, 1);
        assert.strictEqual(aElements.length, 1);
        assert.strictEqual(aElements[0].attribs.href, 'https://example.com');
        addResult('get_html_document_a_elements', true);
    } catch (error) {
        addResult('get_html_document_a_elements', false, error);
    }

    // Test join_url_parts
    try {
        const joinedUrl = textUtil.join_url_parts('https://example.com', 'path', 'to', 'resource');
        assert.strictEqual(joinedUrl, 'https://example.com/path/to/resource');
        addResult('join_url_parts', true);
    } catch (error) {
        addResult('join_url_parts', false, error);
    }

    // Test normalise_linked_url
    try {
        const normalizedUrl = textUtil.normalise_linked_url('https://example.com/page', '/path/to/resource');
        assert.strictEqual(normalizedUrl, 'https://example.com/path/to/resource');
        addResult('normalise_linked_url', true);
    } catch (error) {
        addResult('normalise_linked_url', false, error);
    }

    // Test get_scheme_based_authority
    try {
        const schemeBasedAuthority = textUtil.get_scheme_based_authority('https://example.com/path');
        assert.strictEqual(schemeBasedAuthority, 'https://example.com');
        addResult('get_scheme_based_authority', true);
    } catch (error) {
        addResult('get_scheme_based_authority', false, error);
    }

    // Test is_simple_url
    try {
        const simpleUrl = textUtil.is_simple_url('https://example.com/path');
        assert.strictEqual(simpleUrl, true);
        addResult('is_simple_url', true);
    } catch (error) {
        addResult('is_simple_url', false, error);
    }

    // Test get_string_byte_length
    try {
        const byteLength = textUtil.get_string_byte_length('Hello, world!');
        assert.strictEqual(byteLength, 13);
        addResult('get_string_byte_length', true);
    } catch (error) {
        addResult('get_string_byte_length', false, error);
    }

    // Test compress_sync and decompress_sync
    try {
        const compressed = textUtil.compress_sync('Hello, world!');
        const decompressed = textUtil.decompress_sync(compressed);
        assert.strictEqual(decompressed, 'Hello, world!');
        addResult('compress_sync and decompress_sync', true);
    } catch (error) {
        addResult('compress_sync and decompress_sync', false, error);
    }

    // Test calc_hash_256bit
    try {
        const hash = textUtil.calc_hash_256bit('Hello, world!');
        assert.strictEqual(hash.length, 32);
        addResult('calc_hash_256bit', true);
    } catch (error) {
        addResult('calc_hash_256bit', false, error);
    }

    // Test count_whitespace
    try {
        const whitespaceCount = textUtil.count_whitespace('Hello, world!');
        assert.strictEqual(whitespaceCount, 1);
        addResult('count_whitespace', true);
    } catch (error) {
        addResult('count_whitespace', false, error);
    }

    // Test get_char_info
    try {
        const charInfo = textUtil.get_char_info('A');
        assert.strictEqual(charInfo.type, 'letter');
        assert.strictEqual(charInfo.subtype, 'vowel');
        assert.strictEqual(charInfo.case, 'upper');
        addResult('get_char_info', true);
    } catch (error) {
        addResult('get_char_info', false, error);
    }

    // Test lazy_lookup_get_char_info
    try {
        const lazyCharInfo = textUtil.lazy_lookup_get_char_info('A');
        assert.strictEqual(lazyCharInfo.type, 'letter');
        assert.strictEqual(lazyCharInfo.subtype, 'vowel');
        assert.strictEqual(lazyCharInfo.case, 'upper');
        addResult('lazy_lookup_get_char_info', true);
    } catch (error) {
        addResult('lazy_lookup_get_char_info', false, error);
    }

    // Test fn_tn_filter
    try {
        const textNode = { data: 'Hello', parent: { name: 'p', type: 'tag' } };
        const filterResult = textUtil.fn_tn_filter(textNode);
        assert.strictEqual(filterResult, true);
        addResult('fn_tn_filter', true);
    } catch (error) {
        addResult('fn_tn_filter', false, error);
    }

    // Test get_url_domain
    try {
        const domain = textUtil.get_url_domain('https://example.com/path');
        assert.strictEqual(domain, 'https://example.com');
        addResult('get_url_domain', true);
    } catch (error) {
        addResult('get_url_domain', false, error);
    }

    // Test remake_html
    try {
        const remadeHtml = textUtil.remake_html('<html><body><p>Hello, world!</p></body></html>');
        assert.strictEqual(remadeHtml.includes('<p>Hello, world!</p>'), true);
        addResult('remake_html', true);
    } catch (error) {
        addResult('remake_html', false, error);
    }

    // Test remake_trim_html
    try {
        const trimmedHtml = textUtil.remake_trim_html('<html><body><p>  Hello, world!  </p></body></html>');
        assert.strictEqual(trimmedHtml.includes('<p>Hello, world!</p>'), true);
        addResult('remake_trim_html', true);
    } catch (error) {
        addResult('remake_trim_html', false, error);
    }

    // Test remake_html_to_els_structure
    try {
        const elsStructureHtml = textUtil.remake_html_to_els_structure('<html><body><p>Hello, world!</p></body></html>');
        assert.strictEqual(elsStructureHtml.includes('<p></p>'), true);
        addResult('remake_html_to_els_structure', true);
    } catch (error) {
        addResult('remake_html_to_els_structure', false, error);
    }

    // Test count_character_types
    try {
        const charTypes = textUtil.count_character_types('Hello, world!');
        assert.strictEqual(charTypes.space, 1);
        assert.strictEqual(charTypes.fullStop, 0);
        addResult('count_character_types', true);
    } catch (error) {
        addResult('count_character_types', false, error);
    }

    // Test iterate_chars
    try {
        const chars = Array.from(textUtil.iterate_chars('Hello'));
        assert.deepStrictEqual(chars, ['H', 'e', 'l', 'l', 'o']);
        addResult('iterate_chars', true);
    } catch (error) {
        addResult('iterate_chars', false, error);
    }

    // Test iterate_string_chars_info
    try {
        const charsInfo = Array.from(textUtil.iterate_string_chars_info('Hello'));
        assert.strictEqual(charsInfo[0].type, 'letter');
        assert.strictEqual(charsInfo[0].subtype, 'consonant');
        addResult('iterate_string_chars_info', true);
    } catch (error) {
        addResult('iterate_string_chars_info', false, error);
    }

    // Test iterate_char_type_groups_tokenize_string
    try {
        const tokens = Array.from(textUtil.iterate_char_type_groups_tokenize_string('Hello, world!'));
        //console.log('tokens.length', tokens.length);
        //console.log('tokens', tokens);
        assert.strictEqual(tokens.length, 4);
        assert.strictEqual(tokens[0].value, 'Hello');
        addResult('iterate_char_type_groups_tokenize_string', true);
    } catch (error) {
        addResult('iterate_char_type_groups_tokenize_string', false, error);
    }

    return results;
};

const results = runTests();
let passedCount = 0;
let failedCount = 0;

results.forEach(result => {
    if (result.passed) {
        console.log(`✔ ${result.name}`);
        passedCount++;
    } else {
        console.error(`✖ ${result.name}`);
        console.error(result.error);
        failedCount++;
    }
});

console.log(`\nTests passed: ${passedCount}`);
console.log(`Tests failed: ${failedCount}`);
