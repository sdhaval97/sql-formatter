/**
 * Prism.js - Lightweight syntax highlighting library
 * SQL-focused minimal version for SQL Formatter
 */

(function() {
    'use strict';

    // Main Prism object
    window.Prism = {
        util: {
            encode: function(tokens) {
                if (tokens instanceof Array) {
                    return tokens.map(Prism.util.encode);
                } else {
                    return tokens && typeof tokens === 'object' && tokens.content
                        ? Object.assign(tokens, {content: Prism.util.encode(tokens.content)})
                        : tokens;
                }
            },
            type: function(o) {
                return Object.prototype.toString.call(o).slice(8, -1);
            },
            objId: function(obj) {
                if (!obj['__id']) {
                    Object.defineProperty(obj, '__id', {value: ++Prism.util.currentId});
                }
                return obj['__id'];
            },
            currentId: 0
        },

        languages: {},
        
        plugins: {},

        // Highlight a single element
        highlightElement: function(element, async, callback) {
            var language = Prism.util.getLanguage(element);
            var grammar = Prism.languages[language];

            if (!grammar) {
                Prism.util.setLanguage(element, 'none');
                return;
            }

            var code = element.textContent;
            var env = {
                element: element,
                language: language,
                grammar: grammar,
                code: code
            };

            Prism.hooks.run('before-sanity-check', env);

            if (!env.code) {
                Prism.hooks.run('complete', env);
                return;
            }

            Prism.hooks.run('before-highlight', env);

            env.highlightedCode = Prism.highlight(env.code, env.grammar, env.language);

            Prism.hooks.run('before-insert', env);

            env.element.innerHTML = env.highlightedCode;

            Prism.hooks.run('after-highlight', env);
            Prism.hooks.run('complete', env);
        },

        // Highlight code string
        highlight: function(text, grammar, language) {
            var env = {
                code: text,
                grammar: grammar,
                language: language
            };
            
            Prism.hooks.run('before-tokenize', env);
            env.tokens = Prism.tokenize(env.code, env.grammar);
            Prism.hooks.run('after-tokenize', env);
            
            return Prism.Token.stringify(Prism.util.encode(env.tokens), env.language);
        },

        // Tokenize code
        tokenize: function(text, grammar) {
            var rest = grammar.rest;
            if (rest) {
                for (var token in rest) {
                    grammar[token] = rest[token];
                }
                delete grammar.rest;
            }

            var tokenList = new Prism.util.LinkedList();
            Prism.util.addAfter(tokenList, tokenList.head, text);
            Prism.util.matchGrammar(text, tokenList, grammar, tokenList.head, 0);
            return Prism.util.toArray(tokenList);
        },

        hooks: {
            all: {},
            add: function(name, callback) {
                var hooks = Prism.hooks.all;
                hooks[name] = hooks[name] || [];
                hooks[name].push(callback);
            },
            run: function(name, env) {
                var callbacks = Prism.hooks.all[name];
                if (!callbacks || !callbacks.length) {
                    return;
                }
                for (var i = 0, callback; callback = callbacks[i++];) {
                    callback(env);
                }
            }
        },

        Token: function(type, content, alias, matchedStr, greedy) {
            this.type = type;
            this.content = content;
            this.alias = alias;
            this.length = (matchedStr || "").length | 0;
            this.greedy = !!greedy;
        }
    };

    // Token stringify method
    Prism.Token.stringify = function(o, language) {
        if (typeof o == 'string') {
            return o;
        }
        if (Array.isArray(o)) {
            var s = '';
            o.forEach(function(e) {
                s += Prism.Token.stringify(e, language);
            });
            return s;
        }

        var env = {
            type: o.type,
            content: Prism.Token.stringify(o.content, language),
            tag: 'span',
            classes: ['token', o.type],
            attributes: {},
            language: language
        };

        var aliases = o.alias;
        if (aliases) {
            if (Array.isArray(aliases)) {
                Array.prototype.push.apply(env.classes, aliases);
            } else {
                env.classes.push(aliases);
            }
        }

        Prism.hooks.run('wrap', env);

        var attributes = '';
        for (var name in env.attributes) {
            attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
        }

        return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
    };

    // Utility functions
    Prism.util.getLanguage = function(element) {
        var m = element.className.match(/\blang(?:uage)?-([\w-]+)\b/i);
        return m ? m[1].toLowerCase() : 'none';
    };

    Prism.util.setLanguage = function(element, language) {
        element.className = element.className.replace(/\blang(?:uage)?-[\w-]+\b/i, '');
        element.className += ' language-' + language;
    };

    // Simplified LinkedList implementation
    Prism.util.LinkedList = function() {
        var head = {value: null, prev: null, next: null};
        var tail = {value: null, prev: head, next: null};
        head.next = tail;

        this.head = head;
        this.tail = tail;
        this.length = 0;
    };

    Prism.util.addAfter = function(list, node, value) {
        var next = node.next;
        var newNode = {value: value, prev: node, next: next};
        node.next = newNode;
        next.prev = newNode;
        list.length++;
        return newNode;
    };

    Prism.util.toArray = function(list) {
        var array = [];
        var node = list.head.next;
        while (node !== list.tail) {
            array.push(node.value);
            node = node.next;
        }
        return array;
    };

    // Simple grammar matching
    Prism.util.matchGrammar = function(text, tokenList, grammar, startNode, startPos) {
        for (var token in grammar) {
            if (!grammar.hasOwnProperty(token) || !grammar[token]) {
                continue;
            }

            var pattern = grammar[token];
            pattern = Array.isArray(pattern) ? pattern : [pattern];

            for (var j = 0; j < pattern.length; ++j) {
                if (!pattern[j]) continue;

                var patternObj = pattern[j];
                var inside = patternObj.inside;
                var lookbehind = !!patternObj.lookbehind;
                var greedy = !!patternObj.greedy;
                var alias = patternObj.alias;

                if (greedy && !patternObj.pattern.global) {
                    var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
                    patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
                }

                var pattern = patternObj.pattern || patternObj;

                for (var currentNode = startNode.next, pos = startPos; currentNode !== tokenList.tail; pos += currentNode.value.length, currentNode = currentNode.next) {
                    if (currentNode.value instanceof Prism.Token) {
                        continue;
                    }

                    var str = currentNode.value;
                    var match = pattern.exec(str);

                    if (match) {
                        if (lookbehind) {
                            var lookbehindLength = match[1] ? match[1].length : 0;
                            var delNum = match.index + lookbehindLength;
                            var before = str.slice(0, delNum);
                            var inside = str.slice(delNum, delNum + match[0].length - lookbehindLength);
                            var after = str.slice(delNum + match[0].length - lookbehindLength);

                            var beforeNode = Prism.util.addAfter(tokenList, currentNode.prev, before);
                            var insideNode = Prism.util.addAfter(tokenList, beforeNode, new Prism.Token(token, inside, alias, match[0], greedy));
                            if (after) {
                                Prism.util.addAfter(tokenList, insideNode, after);
                            }

                            currentNode.prev.next = currentNode.next;
                            currentNode.next.prev = currentNode.prev;
                            tokenList.length--;

                            currentNode = insideNode;
                        } else {
                            var from = match.index;
                            var matchStr = match[0];
                            var before = str.slice(0, from);
                            var after = str.slice(from + matchStr.length);

                            var reach = pos + str.length;
                            if (before) {
                                Prism.util.addAfter(tokenList, currentNode.prev, before);
                                pos += before.length;
                            }

                            var wrapped = new Prism.Token(token, matchStr, alias, matchStr, greedy);
                            currentNode = Prism.util.addAfter(tokenList, currentNode.prev, wrapped);

                            if (after) {
                                Prism.util.addAfter(tokenList, currentNode, after);
                            }

                            if (inside && Prism.languages[inside]) {
                                Prism.util.matchGrammar(matchStr, new Prism.util.LinkedList(), Prism.languages[inside], currentNode, 0);
                            }
                        }
                    }
                }
            }
        }
    };

    // SQL Language Definition
    Prism.languages.sql = {
        'comment': {
            pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,
            lookbehind: true
        },
        'variable': [
            {
                pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,
                greedy: true
            },
            /@[\w.$]+/
        ],
        'string': {
            pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,
            greedy: true,
            lookbehind: true
        },
        'function': /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i,
        'keyword': /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:_INSERT|COL)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN(?:S|ING)?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i,
        'boolean': /\b(?:TRUE|FALSE|NULL)\b/i,
        'number': /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i,
        'operator': /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|IN|LIKE|NOT|OR|IS|DIV|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,
        'punctuation': /[;[\]()`,.]/
    };

    // Auto-highlight when DOM is ready
    function highlightAll() {
        var elements = document.querySelectorAll('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code');
        
        for (var i = 0; i < elements.length; i++) {
            Prism.highlightElement(elements[i]);
        }
    }

    // Initialize highlighting
    if (document.readyState !== 'loading') {
        highlightAll();
    } else {
        document.addEventListener('DOMContentLoaded', highlightAll);
    }

    // Export highlight function for manual use
    window.Prism.highlightAll = highlightAll;

})();