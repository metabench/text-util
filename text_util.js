const liburl = (typeof window !== 'undefined' && window.URL)
    ? {
          parse: (urlStr) => {
              const urlObj = new URL(urlStr);
              return {
                  protocol: urlObj.protocol,
                  hostname: urlObj.hostname,
                  host: urlObj.host,
                  hash: urlObj.hash,
                  search: urlObj.search
              };
          }
      }
    : require('url');
const {clone} = require('lang-mini');
const crypto = require('crypto');
const zlib = require('zlib');
const cheerio = require('cheerio');
const {
    Parser
} = require('htmlparser2');
const {
    DomHandler
} = require('domhandler');
const render = require("dom-serializer").default;
const clone_node = (node) => {
    if (node.type === 'tag') {
      const clonedNode = {
        ...node,
        attribs: { ...node.attribs },
        children: node.children.map(childNode => clone_node(childNode)),
        parent: null
      };
      clonedNode.children.forEach(childNode => {
        childNode.parent = clonedNode;
      });
      return clonedNode;
    } else if (node.type === 'text') {
      return {
        ...node,
        parent: null
      };
    } else if (node.type === 'comment') {
      return {
        ...node,
        parent: null
      };
    } else if (node.type === 'directive') {
      return {
        ...node,
        parent: null
      };
    } else if (node.type === 'cdata') {
      return {
        ...node,
        parent: null
      };
    }
    return node;
  }
  function strip_attributes(node) {
    if (node.type === 'tag' || node.type === 'script' || node.type === 'style') {
      node.attribs = {}; // Remove all attributes from the node
    }
    if (node.children && node.children.length) {
      for (const childNode of node.children) {
        strip_attributes(childNode); // Recursively strip attributes from child nodes
      }
    }
    return node;
  }
  function strip_attributes_and_text(node) {
    if (node.type === 'tag' || node.type === 'script' || node.type === 'style') {
      node.attribs = {}; // Remove all attributes from the node
    }
    if (node.type === 'text') {
      node.data = ''; // Remove text content from the node
    }
    if (node.children && node.children.length) {
      for (const childNode of node.children) {
        strip_attributes_and_text(childNode); // Recursively strip attributes and text from child nodes
      }
    }
    return node;
  }
  function strip_attributes_and_text_and_inner_svg(node) {
    if (node.type === 'tag' || node.type === 'script' || node.type === 'style') {
      node.attribs = {}; // Remove all attributes from the node
    }
    if (node.type === 'text') {
      node.data = ''; // Remove text content from the node
    }
    if (node.name === 'svg') {
      node.children = []; // Remove all child nodes inside SVG elements
    }
    if (node.children && node.children.length) {
      for (const childNode of node.children) {
        strip_attributes_and_text_and_inner_svg(childNode); // Recursively strip attributes, text, and inner SVG nodes from child nodes
      }
    }
    return node;
  }
function analyzeText(text) {
    const textLength = text.length;
    const spaceCount = (text.match(/ /g) || []).length;
    const fullStopCount = (text.match(/\./g) || []).length;
    const semicolonCount = (text.match(/;/g) || []).length;
    const squareBracketCount = (text.match(/\[/g) || []).length;
    const colonCount = (text.match(/:/g) || []).length;
    const doubleQuoteCount = (text.match(/"/g) || []).length;
    const curlyBracketCount = (text.match(/{/g) || []).length;
    const otherPunctuationCount = text.replace(/[ .]/g, '').length;
    const spaceToFullStopRatio = fullStopCount !== 0 ? spaceCount / textLength : NaN;
    const spaceToParenthesesRatio = text.match(/\(|\)/g)?.length || 0;
    const fullStopSpaceToFullStopRatio = fullStopCount !== 0 ? (text.match(/\.\s/g) || []).length / fullStopCount : NaN;
    const squareBracketToCharactersRatio = squareBracketCount !== 0 ? squareBracketCount / (textLength / 2) : NaN;
    const curlyBracketToCharactersRatio = curlyBracketCount !== 0 ? curlyBracketCount / (textLength / 2) : NaN;
    const colonToCharactersRatio = colonCount !== 0 ? colonCount / textLength : NaN;
    const doubleQuoteToSpaceRatio = spaceCount !== 0 ? doubleQuoteCount / spaceCount : NaN;
    return {
        spaceCount,
        fullStopCount,
        semicolonCount,
        squareBracketCount,
        colonCount,
        doubleQuoteCount,
        curlyBracketCount,
        otherPunctuationCount,
        spaceToFullStopRatio,
        spaceToParenthesesRatio,
        fullStopSpaceToFullStopRatio,
        squareBracketToCharactersRatio,
        curlyBracketToCharactersRatio,
        colonToCharactersRatio,
        doubleQuoteToSpaceRatio
    };
}
const simple_ratio_analyse_text = analyzeText;
const indicate_is_computer_language = text => {
    const value = text;
    if (typeof value === 'string') {
        const txt_an = simple_ratio_analyse_text(value);
        txt_an.squareBracketToCharactersRatio = txt_an.squareBracketCount / value.length;
        let discard = false;
        if (value.length > 300) {
            if (txt_an.doubleQuoteToSpaceRatio > 0.1) {
                discard = true;
            }
            if (txt_an.fullStopCount > 2) {
                if (txt_an.fullStopSpaceToFullStopRatio < 0.45) {
                    discard = true;
                }
            }
            if (txt_an.colonCount > 10) {
                if (txt_an.colonToCharactersRatio > 0.095) {
                    discard = true;
                }
            }
            if (txt_an.curlyBracketToCharactersRatio > 0.008 && txt_an.colonToCharactersRatio > 0.012) {
                discard = true;
            }
        }
        return discard;
    } else {
        console.trace();
        throw 'stop';
    }
};
function* iterate_html_document_nodes(html) {
    const arr_html_nodes = [];
    const handler = new DomHandler((error, dom) => {
        if (error) {
            console.error(error);
        } else {
            function traverse(nodes, parentXPath = '', parentPath = '', parentStartIndex = 0) {
                let siblingIndex = 0;
                const o_previous_siblings_of_name = {};
                let num_previous_text_siblings = 0;
                for (const node of nodes) {
                    arr_html_nodes.push(node);
                    if (node.type === 'text') {
                        const value = node.data;
                        const length = value.length;
                        const textSiblingIndex = num_previous_text_siblings + 1;
                        const currentXPath = parentXPath !== '' ? parentXPath + '/' + 'text()' + '[' + textSiblingIndex + ']' : '/' + 'text()' + '[' + textSiblingIndex + ']';
                        node.xpath = currentXPath;
                        node.sibling_index = textSiblingIndex;
                        const path = parentPath !== '' ? parentPath : '';
                        node.el_sel_path = path;
                        const start_pos = parentStartIndex + node.startIndex;
                        if (false) {
                            arr_html_nodes.push({
                                document_id: downloaded_url_id,
                                value,
                                length,
                                element_selector_path: path,
                                xpath: currentXPath,
                                sibling_index: siblingIndex,
                                start_pos,
                            });
                        }
                        num_previous_text_siblings++;
                    } else if (node.type === 'tag') {
                        if (node.name) {
                            const sibling_index = (o_previous_siblings_of_name[node.name] || 0) + 1;
                            const currentXPath = parentXPath !== '' ? parentXPath + '/' + node.name + '[' + sibling_index + ']' : '/' + node.name + '[' + sibling_index + ']';
                            const path = parentPath !== '' ? parentPath + ' > ' + node.name : node.name;
                            node.xpath = currentXPath;
                            node.el_sel_path = path;
                            node.sibling_index = sibling_index;
                            if (node.children) {
                                traverse(node.children, currentXPath, path, node.startIndex);
                            }
                            o_previous_siblings_of_name[node.name] = sibling_index;
                        }
                    } else {
                        if (node.type === 'comment') {
                        } else if (node.type === 'directive') {
                        } else if (node.type === 'script') {
                            const tn_script = node.children[0];
                            if (tn_script) {
                            } else {
                                const src = node.attribs.src;
                            }
                        }
                    }
                    siblingIndex++;
                }
            }
            traverse(dom);
        }
    }, {
        withStartIndices: true,
        withEndIndices: true
    });
    const parser = new Parser(handler);
    parser.write(html);
    parser.end();
    for (const node of arr_html_nodes) {
        yield node;
    }
}
const get_html_document_text_nodes = (html, downloaded_url_id, filter, do_trim_white_space = true) => {
    const textNodes = [];
    const handler = new DomHandler((error, dom) => {
        if (error) {
            console.error(error);
        } else {
            function traverse(nodes, parentXPath = '', parentPath = '', parentStartIndex = 0) {
                let siblingIndex = 0;
                const o_previous_siblings_of_name = {};
                let num_previous_text_siblings = 0;
                for (const node of nodes) {
                    if (node.type === 'text') {
                        let ctu = true;
                        if (typeof filter === 'function') {
                            const passes_filter = filter(node);
                            if (!passes_filter) ctu = false;
                        }
                        const value = do_trim_white_space ? node.data.trim() : node.data;
                        const length = value.length;
                        const textSiblingIndex = num_previous_text_siblings + 1;
                        const currentXPath = parentXPath !== '' ? parentXPath + '/' + 'text()' + '[' + textSiblingIndex + ']' : '/' + 'text()' + '[' + textSiblingIndex + ']';
                        const path = parentPath !== '' ? parentPath : '';
                        const start_pos = parentStartIndex + node.startIndex;
                        if (ctu) {
                            textNodes.push({
                                document_id: downloaded_url_id,
                                value,
                                length,
                                element_selector_path: path,
                                xpath: currentXPath,
                                sibling_index: siblingIndex,
                                start_pos,
                            });
                        }
                        num_previous_text_siblings++;
                    }
                    if (node.name) {
                        const sibling_index = (o_previous_siblings_of_name[node.name] || 0) + 1;
                        if (node.children) {
                            const currentXPath = parentXPath !== '' ? parentXPath + '/' + node.name + '[' + sibling_index + ']' : '/' + node.name + '[' + sibling_index + ']';
                            const path = parentPath !== '' ? parentPath + ' > ' + node.name : node.name;
                            traverse(node.children, currentXPath, path, node.startIndex);
                        }
                        o_previous_siblings_of_name[node.name] = sibling_index;
                    }
                    siblingIndex++;
                }
            }
            traverse(dom);
        }
    }, {
        withStartIndices: true,
        withEndIndices: true
    });
    const parser = new Parser(handler);
    parser.write(html);
    parser.end();
    return textNodes;
}
const get_html_document_a_elements = (html_document, downloaded_url_id) => {
    const a_elements = [];
    const handler = new DomHandler((error, dom) => {
        if (error) {
            console.error(error);
        } else {
            function traverse(nodes, parentXPath = '', parentPath = '', parentStartIndex = 0) {
                let siblingIndex = 0;
                const o_previous_siblings_of_name = {};
                let num_previous_a_siblings = 0;
                for (const node of nodes) {
                    if (node.type === 'tag') {
                        if (node.name) {
                            if (node.name === 'a') {
                                const aSiblingIndex = num_previous_a_siblings + 1;
                                const {attribs} = node;
                                const {href, target, rel} = attribs;
                                const css_class = attribs['class'];
                                const currentXPath = parentXPath !== '' ? parentXPath + '/' + 'a' + '[' + aSiblingIndex + ']' : '/' + 'a' + '[' + aSiblingIndex + ']';
                                const path = parentPath !== '' ? parentPath : '';
                                const start_pos = parentStartIndex + node.startIndex;
                                const end_pos = parentStartIndex + node.endIndex;
                                const length = end_pos - start_pos;
                                const deal_with_inner_text_nodes = () => {
                                    console.log('node.children.length', node.children.length);
                                    const inner_text_nodes = [];
                                    const iterate_el = (el) => {
                                        if (el.children.length === 1) {
                                            const cn = el.children[0];
                                            if (cn.type === 'text') {
                                                inner_text_nodes.push(cn);
                                            } else {
                                                iterate_el(cn);
                                            }
                                        } else if (el.children.length > 1) {
                                            for (const cn of el.children) {
                                                if (cn.type === 'text') {
                                                    inner_text_nodes.push(cn);
                                                } else if (cn.type === 'tag') {
                                                    iterate_el(cn);
                                                } else {
                                                }
                                            }
                                        }
                                    }
                                    if (node.children.length === 1) {
                                        const cn = node.children[0];
                                        if (cn.type === 'text') {
                                            inner_text_nodes.push(cn);
                                        } else {
                                            if (cn.type === 'tag') {
                                                iterate_el(cn);
                                            }
                                        }
                                    } else if (node.children.length > 1) {
                                        for (const cn of node.children) {
                                            if (cn.type === 'text') {
                                                inner_text_nodes.push(cn);
                                            } else {
                                                if (cn.type === 'tag') {
                                                    iterate_el(cn);
                                                }
                                            }
                                        }
                                    }
                                    console.log('inner_text_nodes', inner_text_nodes);
                                    console.log('inner_text_nodes.length', inner_text_nodes.length);
                                }
                                const o = {attribs, xpath: currentXPath, el_path: path, start_pos, end_pos, length};
                                const support_html_structure = () => {
                                    const node2 = clone_node(node);
                                    strip_attributes_and_text_and_inner_svg(node2);
                                    o.html_structure = render(node2);
                                }
                                if (downloaded_url_id !== undefined && typeof downloaded_url_id === 'number') {
                                    o.document_id = downloaded_url_id;
                                }
                                a_elements.push(o);
                                num_previous_a_siblings++;
                            }
                            const sibling_index = (o_previous_siblings_of_name[node.name] || 0) + 1;
                            if (node.children) {
                                const currentXPath = parentXPath !== '' ? parentXPath + '/' + node.name + '[' + sibling_index + ']' : '/' + node.name + '[' + sibling_index + ']';
                                const path = parentPath !== '' ? parentPath + ' > ' + node.name : node.name;
                                traverse(node.children, currentXPath, path, node.startIndex);
                            }
                            o_previous_siblings_of_name[node.name] = sibling_index;
                        }
                        siblingIndex++;
                    }
                    /*
                    if (node.type === 'text') {
                        const value = node.data;
                        const length = value.length;
                        const textSiblingIndex = num_previous_text_siblings + 1;
                        const currentXPath = parentXPath !== '' ? parentXPath + '/' + 'text()' + '[' + textSiblingIndex + ']' : '/' + 'text()' + '[' + textSiblingIndex + ']';
                        const path = parentPath !== '' ? parentPath : '';
                        const start_pos = parentStartIndex + node.startIndex;
                        textNodes.push({
                            downloaded_url_id,
                            value,
                            length,
                            element_selector_path: path,
                            xpath: currentXPath,
                            sibling_index: siblingIndex,
                            start_pos,
                        });
                        num_previous_text_siblings++;
                    }
                    */
                }
            }
            traverse(dom);
        }
    }, {
        withStartIndices: true,
        withEndIndices: true
    });
    const parser = new Parser(handler);
    parser.write(html_document);
    parser.end();
    return a_elements;
}
const site_url_from_page_url = page_url => {
    const p = liburl.parse(page_url);
    return p.protocol + '//' + p.hostname;
}
const join_url_parts = (...a) => {
    let has_trailing_fslash = false;
    let res = '';
    const l = a.length;
    for (let c = 0; c < l; c++) {
        if (c > 0) {
            if (a[c].substring(0, 1) === '/') {
                if (has_trailing_fslash) {
                    res = res.substring(0, res.length - 1);
                }
            } else {
                if (!has_trailing_fslash) {
                    res = res + '/';
                }
            }
        }
        res = res + a[c];
        if (res.substring(res.length - 1, res.length) === '/') {
            has_trailing_fslash = true;
        } else {
            has_trailing_fslash = false;
        }
    }
    return res;
}
const normalise_linked_url = (page_url, linked_url, archive_url) => {
    if (archive_url) {
        throw 'NYI'
    } else {
        if (typeof page_url === 'string' && linked_url === undefined) return page_url;
    }
    if (linked_url.startsWith('https://') || linked_url.startsWith('http://')) {
        return linked_url;
    } else {
        if (linked_url.startsWith('/')) {
            if (archive_url) {
                return join_url_parts(archive_url, linked_url);
            } else {
                if (page_url) {
                    return join_url_parts(site_url_from_page_url(page_url), linked_url);
                } else {
                    return linked_url;
                }
            }
        } else {
            if (linked_url.startsWith('#')) {
                if (archive_url) {
                    return join_url_parts(archive_url, page_url, linked_url);
                } else {
                    return join_url_parts(site_url_from_page_url(page_url), linked_url);
                }
            } else {
                return undefined;
            }
        }
    }
}
const get_scheme_based_authority = (url) => {
    const parsedUrl = liburl.parse(url);
    const schemeBasedAuthority = `${parsedUrl.protocol}//${parsedUrl.host}`;
    return schemeBasedAuthority;
  };
  const is_integer = (str) => /^-?\d+$/.test(str);
const is_simple_url = url => {
    let res = true;
    if (url.length > 180) {
        res = false;
    } else {
        const parsed_url = liburl.parse(url);
        if (parsed_url.hash) res = false;
        if (parsed_url.query) {
            const queryParameters = new URLSearchParams(parsed_url.search);
            const arr_search_params = Array.from(queryParameters.entries());
            if (arr_search_params.length > 1) {
                res = false;
            } else {
                if (arr_search_params[0][1].length > 8) {
                    res = false;
                } else {
                    if (is_integer(arr_search_params[0][1])) {
                    } else {
                        res = false;
                    }
                }
            }
        }
    }
    return res;
}
const get_string_byte_length = (str) => {
    const encoder = new TextEncoder();
    const encoded_data = encoder.encode(str);
    return encoded_data.length;
  };
  const compress_sync = (inputString, level = 10) => {
    const inputBuffer = Buffer.from(inputString);
    const compressedBuffer = zlib.brotliCompressSync(inputBuffer, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: level
        }});
    return compressedBuffer;
};
const decompress_sync = (buf) => {
    const value = zlib.brotliDecompressSync(buf).toString('utf-8');
    return value;
}
const calc_hash_256bit = value => value === undefined ? undefined : crypto.createHash('sha256').update(value).digest();
const remake_trim_html = str_html => {
    const $ = cheerio.load(str_html);
    const iterateOverTextNodes = (element) => {
        element.contents().each((_, el) => {
          if (el.type === 'text') {
            el.data = el.data.trim();
          } else if (el.type === 'tag') {
            iterateOverTextNodes($(el));
          }
        });
      };
      iterateOverTextNodes($.root());
    /*
    $.root().contents().each((_, el) => {
        if (el.type === 'text') {
          console.log('text el.data', el.data);
        } else if (el.type === 'tag') {
          iterateOverTextNodes($(el));
        }
      });
      */
    const serializedHtml = $.html();
    return serializedHtml;
}
const read_first_tag_name = str_html => {
    let pos1 = str_html.indexOf('<');
    if (pos1 > -1) {
        let pos2 = str_html.indexOf('>', pos1);
        let el_opening = str_html.substring(pos1 + 1, pos2);
        let pos3 = el_opening.indexOf(' ');
        if (pos3 === -1) return el_opening;
        return el_opening.substring(0, pos3);
    }
}
function outerHTML (element) {
    var index = element.index();
    var parent = element.parent().clone();
    var child = parent.children()[index];
    parent.empty();
    parent.append(child);
    return parent.html();
}
const remake_html_to_els_structure = str_html => {
    if (str_html.startsWith('<!doctype html>')) {
        return remake_html_to_els_structure(str_html.substring('<!doctype html>'.length));
    } else {
        const $ = cheerio.load(str_html);
        const iterate_nodes = (element) => {
            const to_remove = [];
            element.contents().each((_, el) => {
            if (el.type === 'text') {
                to_remove.push(el);
            } else {
                if (el.type === 'comment' || el.name === 'comment') {
                    to_remove.push(el);
                } else if (el.type === 'script' || el.name === 'script') {
                    to_remove.push(el);
                } else if (el.type === 'svg' || el.name === 'svg') {
                    to_remove.push(el);
                } else if (el.type === 'style' || el.name === 'style') {
                    to_remove.push(el);
                } else {
                    if (el.attribs) {
                        if (Object.keys(el.attribs).length > 0) {
                            el.attribs = {};
                        }
                    }
                    iterate_nodes($(el));
                }
            }
            });
            for (const el_to_remove of to_remove) {
                const index = el_to_remove.parent.children.indexOf(el_to_remove);
                el_to_remove.parent.children.splice(index, 1);
            }
        };
        iterate_nodes($.root());
        const first_tag_name = read_first_tag_name(str_html);
        if (first_tag_name === undefined) {
        } else if (first_tag_name === 'html') {
            const serializedHtml = $.html();
            return serializedHtml;
        } else {
            if (first_tag_name === 'head') {
                const serializedHtml = outerHTML($('head'));
                return serializedHtml;
            } else if (first_tag_name === 'body') {
                const serializedHtml = outerHTML($('body'));
                return serializedHtml;
            } else {
                const serializedHtml = $('body').html();
                return serializedHtml;
            }
        }
    }
}
const remake_html = str_html => {
    let parsed_dom;
    const handler = new DomHandler((error, dom) => {
        if (error) {
            console.error(error);
        } else {
            parsed_dom = dom;
        }
    });
    const parser = new Parser(handler);
    parser.write(str_html);
    parser.end();
    res = render(parsed_dom);
    return res;
}
const count_whitespace = str => {
    const whitespaceRegex = /\s/g;
    const matches = str.match(whitespaceRegex);
    return matches ? matches.length : 0;
  };
const fn_tn_filter = (tn) => {
    const {parent} = tn;
    const text = tn.data;
    const parent_name = parent.name;
    if (parent.type === 'root') return false;
    if (parent_name === 'html') return false;
    if (parent_name === 'head') return false;
    if (parent_name === 'script') return false;
    if (parent_name === 'title') return true;
    if (parent_name === 'style') return false;
    const cws_text = count_whitespace(text);
    if (cws_text === text.length) return false;
    if (parent_name === 'span') return true;
    if (parent_name === 'div') return true;
    if (parent_name === 'h1') return true;
    if (parent_name === 'h2') return true;
    if (parent_name === 'h3') return true;
    if (parent_name === 'h4') return true;
    if (parent_name === 'h5') return true;
    if (parent_name === 'h6') return true;
    if (parent_name === 'a') return true;
    if (parent_name === 'p') return true;
    if (parent_name === 'strong') return true;
    if (parent_name === 'em') return true;
    if (parent_name === 'b') return true;
    if (parent_name === 'i') return true;
    if (parent_name === 'q') return true; // inline quotation
    if (parent_name === 's') return true; // strikethrough
    if (parent_name === 'u') return true; // unarticulated annotation
    if (parent_name === 'small') return true;
    if (parent_name === 'time') return true;
    if (parent_name === 'button') return true;
    if (parent_name === 'label') return true;
    if (parent_name === 'nav') return true;
    if (parent_name === 'caption') return true;
    if (parent_name === 'th') return true;
    if (parent_name === 'td') return true;
    if (parent_name === 'dt') return true;
    if (parent_name === 'dd') return true;
    if (parent_name === 'li') return true;
    if (parent_name === 'option') return true;
    if (parent_name === 'legend') return true;
    if (parent_name === 'figcaption') return true;
    if (parent_name === 'sub') return true;
    if (parent_name === 'sup') return true;
    if (parent_name === 'details') return true;
    if (parent_name === 'blockquote') return true;
    if (parent_name === 'cite') return true;
    if (parent_name === 'code') return true;
    if (parent_name === 'abbr') return true;
    if (parent_name === 'section') return true;
    if (parent_name === 'footer') return true;
    if (parent_name === 'noscript') return true;
    if (parent_name === 'samp') return true;
    if (parent_name === 'desc') return true;
    if (parent_name === 'select') return false;
    if (parent_name === 'foreignobject') return false;
    if (parent_name === 'text') return false; // within an SVG.
    if (parent_name === 'tspan') return false; // within an SVG.
    if (parent_name === 'stong') return true;
    if (parent_name === 'description') return true;
    if (parent_name === 'lastbuilddate') return false;
    if (parent_name === 'ttl') return false;
    if (parent_name === 'language') return false;
    if (parent_name === 'copyright') return false;
    if (parent_name === 'font') return true;
    if (parent_name === 'itunes:new-feed-url') return false;
    if (parent_name === 'channel') return false;
    return false;
    console.log('tn', tn);
    console.log('parent', parent);
    console.log('parent.name', parent.name);
    console.log('text', text);
    console.log('text.length', text.length);
    console.log('cws_text', cws_text);
    console.trace();
    throw 'stop';
}
const get_url_domain = url => {
    const p = liburl.parse(url);
    return p.protocol + '//' + p.hostname;
}
function count_character_types(str) {
    let space = 0;
    let returnChar = 0;
    let new_line = 0;
    let tab = 0;
    let fullStop = 0;
    let semicolon = 0;
    let squareBracket = 0;
    let colon = 0;
    let doubleQuote = 0;
    let curlyBracket = 0;
    let otherPunctuation = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        switch (char) {
            case ' ':
                space++;
                break;
            case '\r':
                returnChar++;
                break;
            case '\n':
                new_line++;
                break;
            case '\t':
                tab++;
                break;
            case '.':
                fullStop++;
                break;
            case ';':
                semicolon++;
                break;
            case '[':
                squareBracket++;
                break;
            case ':':
                colon++;
                break;
            case '"':
                doubleQuote++;
                break;
            case '{':
                curlyBracket++;
                break;
            default:
                if (/[^\w\s]/.test(char)) {
                    otherPunctuation++;
                }
                break;
        }
    }
    return {
        space,
        new_line,
        return: returnChar,
        tab,
        fullStop,
        semicolon,
        squareBracket,
        colon,
        doubleQuote,
        curlyBracket,
        otherPunctuation
    };
}
const o_scripts = {
    'Basic Latin': [0x0000, 0x007F],
    'Latin-1 Supplement': [0x0080, 0x00FF],
    'Latin Extended-A': [0x0100, 0x017F],
    'Latin Extended-B': [0x0180, 0x024F],
    'IPA Extensions': [0x0250, 0x02AF],
    'Spacing Modifier Letters': [0x02B0, 0x02FF],
    'Combining Diacritical Marks': [0x0300, 0x036F],
    'Greek and Coptic': [0x0370, 0x03FF],
    'Cyrillic': [0x0400, 0x04FF],
    'Armenian': [0x0530, 0x058F],
    'Hebrew': [0x0590, 0x05FF],
    'Arabic': [0x0600, 0x06FF],
    'Syriac': [0x0700, 0x074F],
    'Thaana': [0x0780, 0x07BF],
    'Devanagari': [0x0900, 0x097F],
    'Bengali': [0x0980, 0x09FF],
    'Gurmukhi': [0x0A00, 0x0A7F],
    'Gujarati': [0x0A80, 0x0AFF],
    'Oriya': [0x0B00, 0x0B7F],
    'Tamil': [0x0B80, 0x0BFF],
    'Telugu': [0x0C00, 0x0C7F],
    'Kannada': [0x0C80, 0x0CFF],
    'Malayalam': [0x0D00, 0x0D7F],
    'Sinhala': [0x0D80, 0x0DFF],
    'Thai': [0x0E00, 0x0E7F],
    'Lao': [0x0E80, 0x0EFF],
    'Tibetan': [0x0F00, 0x0FFF],
    'Myanmar': [0x1000, 0x109F],
    'Georgian': [0x10A0, 0x10FF],
    'Hangul Jamo': [0x1100, 0x11FF],
    'Ethiopic': [0x1200, 0x137F],
    'Cherokee': [0x13A0, 0x13FF],
    'Canadian Aboriginal': [0x1400, 0x167F],
    'Ogham': [0x1680, 0x169F],
    'Runic': [0x16A0, 0x16FF],
    'Tagalog': [0x1700, 0x171F],
    'Hanunoo': [0x1720, 0x173F],
    'Buhid': [0x1740, 0x175F],
    'Tagbanwa': [0x1760, 0x177F],
    'Tagbanwa': [0x1760, 0x177F],
    'Khmer': [0x1780, 0x17FF],
    'Mongolian': [0x1800, 0x18AF],
    'Unified Canadian Aboriginal Syllabics Extended': [0x18B0, 0x18FF],
    'Limbu': [0x1900, 0x194F],
    'Tai Le': [0x1950, 0x197F],
    'New Tai Lue': [0x1980, 0x19DF],
    'Khmer Symbols': [0x19E0, 0x19FF],
    'Buginese': [0x1A00, 0x1A1F],
    'Tai Tham': [0x1A20, 0x1AAF],
    'Combining Diacritical Marks Extended': [0x1AB0, 0x1AFF],
    'Balinese': [0x1B00, 0x1B7F],
    'Sundanese': [0x1B80, 0x1BBF],
    'Batak': [0x1BC0, 0x1BFF],
    'Lepcha': [0x1C00, 0x1C4F],
    'Ol Chiki': [0x1C50, 0x1C7F],
    'Cyrillic Extended-C': [0x1C80, 0x1C8F],
    'Georgian Extended': [0x1C90, 0x1CBF],
    'Sundanese Supplement': [0x1CC0, 0x1CCF],
    'Vedic Extensions': [0x1CD0, 0x1CFF],
    'Phonetic Extensions': [0x1D00, 0x1D7F],
    'Phonetic Extensions Supplement': [0x1D80, 0x1DBF],
    'Hangul': [0xAC00, 0xD7AF],
    'Tifinagh': [0x2D30, 0x2D7F],
    'CJK Unified Ideographs': [0x4E00, 0x9FFF],
      'Hiragana': [0x3040, 0x309F],
      'Katakana': [0x30A0, 0x30FF]
    };
    const get_char_info = (str) => {
        const firstChar = str.charAt(0);
        const i_codepoint = firstChar.codePointAt(0);
        if (i_codepoint <= 31) {
            switch (i_codepoint) {
                case 9: {
                    return {
                        type: 'punctuation',
                        name: 'horizontal tab',
                        subtype: 'spacing'
                    }
                }
                case 10: {
                    return {
                        type: 'punctuation',
                        name: 'line feed',
                        subtype: 'spacing'
                    }
                }
                case 13: {
                    return {
                        type: 'punctuation',
                        name: 'carriage return',
                        subtype: 'spacing'
                    }
                }
                case 163: {
                    return {
                        type: 'symbol',
                        subtype: 'currency',
                        name: 'pound sign'
                    }
                }
                case 169: {
                    return {
                        type: 'symbol',
                        name: 'copyright symbol'
                    }
                }
            }
        }
        const getScript = (char) => {
          if (/^[a-zA-Z]$/.test(char)) {
            return 'latin';
          } else if (/^[\u0400-\u04FF]$/.test(char)) {
            return 'cyrillic';
          } else if (/^[\u0531-\u0556\u0561-\u0586]$/.test(char)) {
            return 'armenian';
          }
          return 'unknown';
        };
        if (/^[a-zA-Z]$/.test(firstChar)) {
          const type = 'letter';
          const subtype = /^[aeiouAEIOU]$/.test(firstChar) ? 'vowel' : 'consonant';
          const caseType = /^[a-z]$/.test(firstChar) ? 'lower' : 'upper';
          const script = getScript(firstChar);
          return { value: firstChar, type, subtype, case: caseType, script };
        }
        if (/^\d$/.test(firstChar)) {
          return { value: firstChar, type: 'number' };
        }
        let punctuationName, punctuationSubtype;
        switch (firstChar) {
            case '.':
                punctuationName = 'period';
                break;
            case ',':
                punctuationName = 'comma';
                break;
            case ':':
                punctuationName = 'colon';
                break;
            case ';':
                punctuationName = 'semicolon';
                break;
            case '!':
                punctuationName = 'exclamation mark';
                break;
            case '?':
                punctuationName = 'question mark';
                break;
            case '~':
                punctuationName = 'tilde';
                break;
            case "'":
                punctuationName = 'single quote';
                punctuationSubtype = 'quotation mark';
                break;
            case "‘":
                punctuationName = 'single quote left';
                punctuationSubtype = 'quotation mark';
                break;
            case "’":
                punctuationName = 'single quote right';
                punctuationSubtype = 'quotation mark';
                break;
            case '"':
                punctuationName = 'double quote';
                punctuationSubtype = 'quotation mark';
                break;
            case '(':
                punctuationName = 'left parenthesis';
                punctuationSubtype = 'bracket';
                break;
            case ')':
                punctuationName = 'right parenthesis';
                punctuationSubtype = 'bracket';
                break;
            case '{':
                punctuationName = 'left curly brace';
                punctuationSubtype = 'bracket';
                break;
            case '}':
                punctuationName = 'right curly brace';
                punctuationSubtype = 'bracket';
                break;
            case '[':
                punctuationName = 'left square bracket';
                punctuationSubtype = 'bracket';
                break;
            case ']':
                punctuationName = 'right square bracket';
                punctuationSubtype = 'bracket';
                break;
            case '<':
                punctuationName = 'less than';
                break;
            case '>':
                punctuationName = 'greater than';
                break;
            case '^':
                punctuationName = 'caret';
                break;
            case '+':
                punctuationName = 'plus';
                break;
            case '-':
                punctuationName = 'hyphen'; // or minus sign???
                break;
            case '*':
                punctuationName = 'asterisk';
                break;
            case '/':
                punctuationName = 'forward slash';
                break;
            case '%':
                punctuationName = 'percent';
                break;
            case '&':
                punctuationName = 'ampersand';
                break;
            case '$':
                punctuationName = 'dollar sign';
                punctuationSubtype = 'currency';
                break;
            case '#':
                punctuationName = 'hash';
                break;
            case '@':
                punctuationName = 'at symbol';
                break;
            case '\\':
                punctuationName = 'backslash';
                break;
            case '|':
                punctuationName = 'pipe';
                break;
            case '_':
                punctuationName = 'underscore';
                break;
            default:
                punctuationName = 'space';
                punctuationSubtype = 'spacing';
        }
        if (punctuationName) {
            const res = { value: firstChar, type: 'punctuation', name: punctuationName };
            if (punctuationSubtype) res.subtype = punctuationSubtype;
            return res;
        } else {
            return { value: firstChar, type: 'unknown' };
        }
      }
const charInfoLookup = {};
/**
 * Retrieves information about a Unicode character using lazy lookup.
 * @param {string} character The Unicode character to retrieve information for.
 * @returns {object} An object containing information about the character.
 */
function lazy_lookup_get_char_info(character) {
    if (charInfoLookup[character]) {
        return charInfoLookup[character];
    }
    const characterInfo = get_char_info(character);
    charInfoLookup[character] = characterInfo;
    return characterInfo;
}
const get_text_info = text => {
}
/*
const get_unicode_char_info = (char) => {
    const res = UnicodeData.character(char);
    return res;
}
*/
const iterate_chars = function*(str) {
    const l = str.length;
    for (let c = 0; c < l; c++) {
        yield str.charAt(c);
    }
}
const iterate_string_chars_info = function*(text) {
    let i = 0;
    for (const char of iterate_chars(text)) {
        const char_info = Object.assign({index: i}, clone(lazy_lookup_get_char_info(char)));
        yield char_info;
        i++;
    }
}
const LETTER = 1;
const NUMBER = 2;
const PUNCTUATION = 3;
const MIN_CHARACTER_TYPE_ID = 1;
const MAX_CHARACTER_TYPE_ID = 3;
const o_type_ids = {
    letter: LETTER,
    number: NUMBER,
    punctuation: PUNCTUATION
}
const iterate_char_type_groups_tokenize_string = function*(str) {
    const l = str.length;
    const ta_char_types = new Uint8Array(l);
    let num_tokens = 0;
    let prev_chi;
    let num_consecutive_same_type_tokens = 0;
    let i;
    for (i = 0; i < l; i++) {
        const ch = str.charAt(i);
        const chi = get_char_info(ch);
        const ch_t = chi.type;
        const type_id = o_type_ids[ch_t];
        if (type_id) {
            ta_char_types[i] = type_id;
        } else {
            console.trace();
            throw 'Type not found: ' + ch_t
        }
        if (prev_chi) {
            const prev_ch_t = prev_chi.type;
            if (prev_ch_t === ch_t) {
                num_consecutive_same_type_tokens++;
            } else {
                const last_char_group_length = num_consecutive_same_type_tokens;
                const last_char_group_type = o_type_ids[prev_ch_t];
                num_consecutive_same_type_tokens = 1;
                const pos_start = i - last_char_group_length, pos_end = i;
                const o_token = {
                    idx: num_tokens,
                    value: str.substring(pos_start, pos_end),
                    pos_start,
                    pos_end,
                    length: last_char_group_length,
                    char_type_id: last_char_group_type
                }
                num_tokens++;
                yield o_token;
            }
        } else {
            num_consecutive_same_type_tokens++;
        }
        prev_chi = chi;
    }
    const last_char_group_length = num_consecutive_same_type_tokens;
    const last_char_group_type = o_type_ids[prev_chi.type];
    const pos_start = i - last_char_group_length, pos_end = i;
    const o_token = {
        idx: num_tokens,
        value: str.substring(pos_start, pos_end),
        pos_start,
        pos_end,
        length: last_char_group_length,
        char_type_id: last_char_group_type
    }
    num_tokens++;
    yield o_token;
}
module.exports = {
    analyzeText,
    simple_ratio_analyse_text: analyzeText,
    indicate_is_computer_language,
    get_html_document_text_nodes,
    get_html_document_a_elements,
    iterate_html_document_nodes,
    join_url_parts,
    normalise_linked_url,
    get_scheme_based_authority,
    is_simple_url,
    get_string_byte_length,
    compress_sync,
    decompress_sync,
    calc_hash_256bit,
    count_whitespace,
    get_char_info,
    lazy_lookup_get_char_info,
    fn_tn_filter,
    get_url_domain,
    remake_html,
    remake_trim_html,
    remake_html_to_els_structure,
    count_character_types,
    iterate_chars,
    iterate_string_chars_info,
    iterate_char_type_groups_tokenize_string
}