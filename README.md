# Text Util

A utility library for various text and HTML document processing tasks.

## Installation

To install the library, use npm:

```bash
npm install text-util
```

## API

### `analyzeText(text)`

Analyzes the given text and returns various statistics about it.

**Parameters:**
- `text` (string): The text to analyze.

**Returns:**
- An object containing the following properties:
  - `spaceCount`
  - `fullStopCount`
  - `semicolonCount`
  - `squareBracketCount`
  - `colonCount`
  - `doubleQuoteCount`
  - `curlyBracketCount`
  - `otherPunctuationCount`
  - `spaceToFullStopRatio`
  - `spaceToParenthesesRatio`
  - `fullStopSpaceToFullStopRatio`
  - `squareBracketToCharactersRatio`
  - `curlyBracketToCharactersRatio`
  - `colonToCharactersRatio`
  - `doubleQuoteToSpaceRatio`

### `simple_ratio_analyse_text(text)`

Alias for `analyzeText`.

### `indicate_is_computer_language(text)`

Determines if the given text is likely to be computer code.

**Parameters:**
- `text` (string): The text to analyze.

**Returns:**
- `true` if the text is likely to be computer code, `false` otherwise.

### `get_html_document_text_nodes(html, downloaded_url_id, filter, do_trim_white_space = true)`

Extracts text nodes from an HTML document.

**Parameters:**
- `html` (string): The HTML document.
- `downloaded_url_id` (number): The ID of the downloaded URL.
- `filter` (function): A filter function to apply to the nodes.
- `do_trim_white_space` (boolean): Whether to trim white space from the text nodes.

**Returns:**
- An array of text nodes.

### `get_html_document_a_elements(html_document, downloaded_url_id)`

Extracts `<a>` elements from an HTML document.

**Parameters:**
- `html_document` (string): The HTML document.
- `downloaded_url_id` (number): The ID of the downloaded URL.

**Returns:**
- An array of `<a>` elements.

### `iterate_html_document_nodes(html)`

Iterates over the nodes of an HTML document.

**Parameters:**
- `html` (string): The HTML document.

**Yields:**
- Each node in the document.

### `join_url_parts(...a)`

Joins URL parts into a single URL.

**Parameters:**
- `...a` (string[]): The URL parts to join.

**Returns:**
- The joined URL.

### `normalise_linked_url(page_url, linked_url, archive_url)`

Normalizes a linked URL based on the page URL and archive URL.

**Parameters:**
- `page_url` (string): The page URL.
- `linked_url` (string): The linked URL.
- `archive_url` (string): The archive URL.

**Returns:**
- The normalized URL.

### `get_scheme_based_authority(url)`

Gets the scheme-based authority of a URL.

**Parameters:**
- `url` (string): The URL.

**Returns:**
- The scheme-based authority.

### `is_simple_url(url)`

Determines if a URL is simple.

**Parameters:**
- `url` (string): The URL to check.

**Returns:**
- `true` if the URL is simple, `false` otherwise.

### `get_string_byte_length(str)`

Gets the byte length of a string.

**Parameters:**
- `str` (string): The string.

**Returns:**
- The byte length of the string.

### `compress_sync(inputString, level = 10)`

Compresses a string using Brotli compression.

**Parameters:**
- `inputString` (string): The string to compress.
- `level` (number): The compression level (default is 10).

**Returns:**
- The compressed buffer.

### `decompress_sync(buf)`

Decompresses a Brotli-compressed buffer.

**Parameters:**
- `buf` (Buffer): The compressed buffer.

**Returns:**
- The decompressed string.

### `calc_hash_256bit(value)`

Calculates a 256-bit hash of a value.

**Parameters:**
- `value` (string): The value to hash.

**Returns:**
- The hash as a buffer.

### `count_whitespace(str)`

Counts the number of whitespace characters in a string.

**Parameters:**
- `str` (string): The string.

**Returns:**
- The number of whitespace characters.

### `get_char_info(str)`

Gets information about the first character in a string.

**Parameters:**
- `str` (string): The string.

**Returns:**
- An object containing information about the character.

### `lazy_lookup_get_char_info(character)`

Gets information about a Unicode character using lazy lookup.

**Parameters:**
- `character` (string): The Unicode character.

**Returns:**
- An object containing information about the character.

### `fn_tn_filter(tn)`

Filters text nodes based on their parent element.

**Parameters:**
- `tn` (object): The text node.

**Returns:**
- `true` if the text node passes the filter, `false` otherwise.

### `get_url_domain(url)`

Gets the domain of a URL.

**Parameters:**
- `url` (string): The URL.

**Returns:**
- The domain of the URL.

### `remake_html(str_html)`

Remakes an HTML document.

**Parameters:**
- `str_html` (string): The HTML document.

**Returns:**
- The remade HTML document.

### `remake_trim_html(str_html)`

Remakes an HTML document by trimming text nodes.

**Parameters:**
- `str_html` (string): The HTML document.

**Returns:**
- The remade HTML document.

### `remake_html_to_els_structure(str_html)`

Remakes an HTML document to an elements structure.

**Parameters:**
- `str_html` (string): The HTML document.

**Returns:**
- The remade HTML document.

### `count_character_types(str)`

Counts the types of characters in a string.

**Parameters:**
- `str` (string): The string.

**Returns:**
- An object containing the counts of different character types.

### `iterate_chars(str)`

Iterates over the characters of a string.

**Parameters:**
- `str` (string): The string.

**Yields:**
- Each character in the string.

### `iterate_string_chars_info(text)`

Iterates over the characters of a string and provides information about each character.

**Parameters:**
- `text` (string): The string.

**Yields:**
- An object containing information about each character.

### `iterate_char_type_groups_tokenize_string(str)`

Iterates over character type groups and tokenizes a string.

**Parameters:**
- `str` (string): The string.

**Yields:**
- An object representing each token.
