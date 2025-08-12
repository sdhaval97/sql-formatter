"""
Core SQL formatting functionality using sqlparse library.
Handles various formatting options and SQL dialect support.
"""

import sqlparse
from sqlparse import sql, tokens as T, keywords as K


class SQLFormatter:
    def __init__(self):
        self.default_options = {
            'keyword_case': 'upper',  # 'upper', 'lower', 'capitalize'
            'identifier_case': None,  # None, 'upper', 'lower', 'capitalize' 
            'strip_comments': False,
            'indent_tabs': False,
            'indent_width': 4,
            'wrap_after': 79,
            'comma_first': False,
            'reindent': True,
            'strip_whitespace': True
        }
    
    def format_sql(self, sql_text, options=None):
        """
        Format SQL text with given options.
        
        Args:
            sql_text (str): Raw SQL text to format
            options (dict): Formatting options, uses defaults if None
            
        Returns:
            dict: {
                'formatted_sql': str,
                'success': bool,
                'error': str or None,
                'original_length': int,
                'formatted_length': int
            }
        """
        if not sql_text or not sql_text.strip():
            return {
                'formatted_sql': '',
                'success': False,
                'error': 'Empty SQL provided',
                'original_length': 0,
                'formatted_length': 0
            }
        
        try:
            # Merge provided options with defaults
            format_options = self.default_options.copy()
            if options:
                format_options.update(options)
            
            # Basic formatting with sqlparse
            formatted = sqlparse.format(
                sql_text,
                keyword_case=format_options['keyword_case'],
                identifier_case=format_options['identifier_case'],
                strip_comments=format_options['strip_comments'],
                indent_tabs=format_options['indent_tabs'],
                indent_width=format_options['indent_width'],
                wrap_after=format_options['wrap_after'],
                comma_first=format_options['comma_first'],
                reindent=format_options['reindent'],
                strip_whitespace=format_options['strip_whitespace']
            )
            
            # Additional custom formatting
            formatted = self._apply_custom_formatting(formatted, format_options)
            
            return {
                'formatted_sql': formatted,
                'success': True,
                'error': None,
                'original_length': len(sql_text),
                'formatted_length': len(formatted)
            }
            
        except Exception as e:
            return {
                'formatted_sql': sql_text,  # Return original on error
                'success': False,
                'error': str(e),
                'original_length': len(sql_text),
                'formatted_length': len(sql_text)
            }
    
    def _apply_custom_formatting(self, sql_text, options):
        """Apply additional custom formatting rules."""
        lines = sql_text.split('\n')
        formatted_lines = []
        
        for line in lines:
            # Remove excessive whitespace but preserve intentional indentation
            stripped = line.rstrip()
            if stripped:  # Only add non-empty lines
                formatted_lines.append(stripped)
        
        return '\n'.join(formatted_lines)
    
    def validate_sql(self, sql_text):
        """
        Enhanced SQL syntax validation with detailed error reporting.
        
        Args:
            sql_text (str): SQL text to validate
            
        Returns:
            dict: {
                'is_valid': bool,
                'errors': list of str,
                'warnings': list of str,
                'error_details': list of dict with position info
            }
        """
        if not sql_text or not sql_text.strip():
            return {
                'is_valid': False,
                'errors': ['Empty SQL provided'],
                'warnings': [],
                'error_details': []
            }
        
        try:
            errors = []
            warnings = []
            error_details = []
            
            # Direct string-based validation (more reliable than token parsing)
            sql_upper = sql_text.upper().strip()
            
            # Rule 1: SELECT with WHERE but no FROM
            if sql_upper.startswith('SELECT'):
                has_where = ' WHERE ' in sql_upper
                has_from = ' FROM ' in sql_upper
                
                if has_where and not has_from:
                    errors.append('SELECT with WHERE clause must have FROM clause')
                    error_details.append({
                        'type': 'missing_from_with_where',
                        'message': 'SELECT statement has WHERE clause but missing FROM clause',
                        'position': sql_text.upper().find('WHERE'),
                        'token': 'FROM'
                    })
                
                # Rule 2: SELECT with column-like names but no FROM
                elif not has_from:
                    # Extract the SELECT part
                    select_part = sql_text[6:].strip()  # Remove "SELECT"
                    if ' WHERE ' in select_part.upper():
                        select_part = select_part[:select_part.upper().find(' WHERE ')]
                    
                    # Look for identifiers that could be column names
                    import re
                    identifiers = re.findall(r'\b[a-zA-Z_][a-zA-Z0-9_]*\b', select_part)
                    # Filter out common SQL functions and literals
                    sql_functions = ['NOW', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'CURRENT_DATE', 
                                   'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'NULL', 'TRUE', 'FALSE',
                                   'CONCAT', 'LENGTH', 'UPPER', 'LOWER', 'TRIM', 'SUBSTRING']
                    column_like = [id for id in identifiers if id.upper() not in sql_functions]
                    
                    # If we found potential column names and it's not obviously a function/expression
                    if len(column_like) > 0 and not re.search(r'\d+\s*[\+\-\*\/]|\(\)', select_part):
                        errors.append('SELECT appears to reference column names but missing FROM clause')
                        error_details.append({
                            'type': 'missing_from_columns',
                            'message': f'SELECT appears to reference columns ({", ".join(column_like[:3])}) but missing FROM clause',
                            'position': 6,
                            'token': 'FROM'
                        })
            
            # Rule 3: Keyword typos
            first_word = sql_text.strip().split()[0].upper() if sql_text.strip() else ''
            keyword_typos = {
                'SELCT': 'SELECT', 'SLEECT': 'SELECT', 'SLECT': 'SELECT',
                'INSERTT': 'INSERT', 'INSRT': 'INSERT',
                'UPDAATE': 'UPDATE', 'UDPATE': 'UPDATE',
                'DELETEE': 'DELETE', 'DELEET': 'DELETE'
            }
            
            if first_word in keyword_typos:
                errors.append(f'Typo in SQL keyword: "{first_word}" (did you mean "{keyword_typos[first_word]}"?)')
                error_details.append({
                    'type': 'keyword_typo',
                    'message': f'Typo: "{first_word}" should be "{keyword_typos[first_word]}"',
                    'position': 0,
                    'token': first_word
                })
            
            # Rule 4: INSERT without INTO
            if sql_upper.startswith('INSERT') and ' INTO ' not in sql_upper:
                errors.append('INSERT statement missing INTO clause')
                error_details.append({
                    'type': 'missing_into',
                    'message': 'INSERT statement missing INTO clause',
                    'position': 6,
                    'token': 'INTO'
                })
            
            # Rule 5: Unmatched parentheses
            open_parens = sql_text.count('(')
            close_parens = sql_text.count(')')
            if open_parens != close_parens:
                if open_parens > close_parens:
                    errors.append(f'{open_parens - close_parens} unmatched opening parenthesis(es)')
                else:
                    errors.append(f'{close_parens - open_parens} unmatched closing parenthesis(es)')
                error_details.append({
                    'type': 'unmatched_parentheses',
                    'message': f'Unmatched parentheses: {open_parens} opening, {close_parens} closing',
                    'position': 0,
                    'token': '(' if open_parens > close_parens else ')'
                })
            
            # Rule 6: Unmatched quotes
            single_quotes = sql_text.count("'")
            if single_quotes % 2 != 0:
                errors.append('Unmatched single quote')
                error_details.append({
                    'type': 'unmatched_quote',
                    'message': 'Unmatched single quote',
                    'position': sql_text.rfind("'"),
                    'token': "'"
                })
            
            # Rule 7: Missing semicolon (warning)
            if not sql_text.strip().endswith(';'):
                warnings.append('Statement may be missing semicolon')
            
            return {
                'is_valid': len(errors) == 0,
                'errors': errors,
                'warnings': warnings,
                'error_details': error_details
            }
            
        except Exception as e:
            return {
                'is_valid': False,
                'errors': [f'Validation error: {str(e)}'],
                'warnings': [],
                'error_details': [{
                    'type': 'exception',
                    'message': str(e),
                    'position': 0
                }]
            }
    
    def _validate_statement_structure(self, tokens, meaningful_tokens, statement_idx):
        """Validate basic SQL statement structure."""
        errors = []
        warnings = []
        details = []
        
        if not meaningful_tokens:
            return errors, warnings, details
        
        first_token = meaningful_tokens[0]
        
        # Check for common SQL keyword typos
        first_token_upper = first_token.value.upper()
        keyword_typos = {
            'SELCT': 'SELECT',
            'SLEECT': 'SELECT',
            'SLECT': 'SELECT',
            'SELECCT': 'SELECT',
            'INSERTT': 'INSERT',
            'INSRT': 'INSERT',
            'UPDAATE': 'UPDATE',
            'UDPATE': 'UPDATE',
            'DELETEE': 'DELETE',
            'DELEET': 'DELETE',
            'FORM': 'FROM',
            'FRON': 'FROM',
            'WHREE': 'WHERE',
            'WHER': 'WHERE',
            'WEHERE': 'WHERE',
            'GROPU': 'GROUP',
            'GRUP': 'GROUP',
            'ORDERR': 'ORDER',
            'ODER': 'ORDER',
            'HAVNG': 'HAVING',
            'HAVIG': 'HAVING'
        }
        
        if first_token_upper in keyword_typos:
            errors.append(f'Statement {statement_idx + 1}: Possible typo in SQL keyword: "{first_token.value}" (did you mean "{keyword_typos[first_token_upper]}"?)')
            details.append({
                'type': 'keyword_typo',
                'message': f'Possible typo: "{first_token.value}" should be "{keyword_typos[first_token_upper]}"',
                'position': 0,
                'token': first_token.value
            })
        
        # Check if it starts with a valid SQL keyword
        valid_start_keywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'WITH', 'EXPLAIN', 'ANALYZE', 'SHOW', 'DESCRIBE', 'USE']
        if (first_token.ttype in (T.Keyword, T.Keyword.DML, T.Keyword.DDL) or 
            first_token_upper in valid_start_keywords or
            first_token_upper in keyword_typos.values()):
            pass  # Valid start
        elif first_token_upper not in valid_start_keywords and first_token_upper not in keyword_typos:
            errors.append(f'Statement {statement_idx + 1}: Invalid or missing SQL command: "{first_token.value}"')
            details.append({
                'type': 'invalid_command',
                'message': f'Statement starts with invalid keyword: "{first_token.value}"',
                'position': 0,
                'token': first_token.value
            })
        
        # Check for typos in other keywords throughout the statement
        for i, token in enumerate(meaningful_tokens):
            token_upper = token.value.upper()
            if token_upper in keyword_typos and token_upper != first_token_upper:  # Don't double-report first token
                errors.append(f'Statement {statement_idx + 1}: Possible typo in keyword: "{token.value}" (did you mean "{keyword_typos[token_upper]}"?)')
                details.append({
                    'type': 'keyword_typo',
                    'message': f'Possible typo: "{token.value}" should be "{keyword_typos[token_upper]}"',
                    'position': i,
                    'token': token.value
                })
        
        # Check for common syntax issues
        for i, token in enumerate(meaningful_tokens):
            # Check for double keywords
            if i > 0 and token.ttype in (T.Keyword, T.Keyword.DML, T.Keyword.DDL):
                prev_token = meaningful_tokens[i-1]
                if prev_token.ttype in (T.Keyword, T.Keyword.DML, T.Keyword.DDL):
                    if token.value.upper() not in ['BY', 'ON', 'AS', 'OR', 'AND', 'NOT', 'IN', 'IS', 'NULL', 'JOIN', 'OUTER', 'INNER', 'LEFT', 'RIGHT', 'FULL']:
                        errors.append(f'Statement {statement_idx + 1}: Unexpected keyword "{token.value}" after "{prev_token.value}"')
                        details.append({
                            'type': 'unexpected_keyword',
                            'message': f'Unexpected keyword "{token.value}" after "{prev_token.value}"',
                            'position': i,
                            'token': token.value
                        })
            
            # Check for missing operators between identifiers
            if (token.ttype in (T.Name, T.Literal.String.Single, T.Literal.Number.Integer, T.Literal.Number.Float) and 
                i > 0 and meaningful_tokens[i-1].ttype in (T.Name, T.Literal.String.Single, T.Literal.Number.Integer, T.Literal.Number.Float)):
                # Check if there should be an operator between them
                if token.value.upper() not in ['AS', 'AND', 'OR', 'NOT', 'IN', 'IS']:
                    warnings.append(f'Statement {statement_idx + 1}: Missing operator between "{meaningful_tokens[i-1].value}" and "{token.value}"')
        
        return errors, warnings, details
    
    def _check_parentheses(self, tokens, statement_idx):
        """Check for unmatched parentheses."""
        errors = []
        details = []
        paren_stack = []
        
        for i, token in enumerate(tokens):
            if token.ttype is T.Punctuation:
                if token.value == '(':
                    paren_stack.append(i)
                elif token.value == ')':
                    if not paren_stack:
                        errors.append(f'Statement {statement_idx + 1}: Unmatched closing parenthesis')
                        details.append({
                            'type': 'unmatched_paren',
                            'message': 'Unmatched closing parenthesis',
                            'position': i,
                            'token': ')'
                        })
                    else:
                        paren_stack.pop()
        
        if paren_stack:
            errors.append(f'Statement {statement_idx + 1}: {len(paren_stack)} unmatched opening parenthesis(es)')
            for pos in paren_stack:
                details.append({
                    'type': 'unmatched_paren',
                    'message': 'Unmatched opening parenthesis',
                    'position': pos,
                    'token': '('
                })
        
        return {'errors': errors, 'details': details}
    
    def _check_quotes(self, sql_text, statement_idx):
        """Check for unmatched quotes."""
        errors = []
        details = []
        
        # Simple quote checking
        single_quotes = sql_text.count("'")
        double_quotes = sql_text.count('"')
        
        if single_quotes % 2 != 0:
            errors.append(f'Statement {statement_idx + 1}: Unmatched single quote')
            details.append({
                'type': 'unmatched_quote',
                'message': 'Unmatched single quote',
                'position': sql_text.rfind("'"),
                'token': "'"
            })
        
        if double_quotes % 2 != 0:
            errors.append(f'Statement {statement_idx + 1}: Unmatched double quote')
            details.append({
                'type': 'unmatched_quote',
                'message': 'Unmatched double quote',
                'position': sql_text.rfind('"'),
                'token': '"'
            })
        
        return {'errors': errors, 'details': details}
    
    def _check_incomplete_statements(self, meaningful_tokens, statement_idx):
        """Check for incomplete SQL statements."""
        errors = []
        warnings = []
        details = []
        
        if not meaningful_tokens:
            return {'errors': errors, 'warnings': warnings, 'details': details}
        
        first_token = meaningful_tokens[0].value.upper()
        last_token = meaningful_tokens[-1]
        
        # Check for missing semicolon (warning, not error)
        if last_token.value != ';':
            warnings.append(f'Statement {statement_idx + 1}: Missing semicolon at end of statement')
        
        # Check for incomplete SELECT statements
        if first_token == 'SELECT':
            has_from = any(token.value.upper() == 'FROM' for token in meaningful_tokens)
            has_where = any(token.value.upper() == 'WHERE' for token in meaningful_tokens)
            
            # If there's a WHERE clause but no FROM, it's definitely an error
            if has_where and not has_from:
                errors.append(f'Statement {statement_idx + 1}: SELECT with WHERE clause must have FROM clause')
                details.append({
                    'type': 'missing_from_with_where',
                    'message': 'SELECT statement has WHERE clause but missing FROM clause - this is invalid SQL',
                    'position': next(i for i, token in enumerate(meaningful_tokens) if token.value.upper() == 'WHERE'),
                    'token': 'FROM'
                })
            # If selecting what looks like column names without FROM
            elif not has_from and len(meaningful_tokens) > 2:
                # Check if it looks like table columns (identifiers that aren't functions)
                select_part = []
                for i, token in enumerate(meaningful_tokens[1:], 1):  # Skip SELECT
                    if token.value.upper() in ['WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'UNION']:
                        break
                    if token.value != ',':
                        select_part.append(token)
                
                # Look for patterns that suggest column names
                likely_columns = False
                for token in select_part:
                    if (token.ttype in (T.Name, None) and 
                        '(' not in str(token.value) and  # Not a function
                        token.value.upper() not in ['NULL', 'TRUE', 'FALSE'] and  # Not a literal
                        not token.value.isdigit() and  # Not a number
                        "'" not in str(token.value)):  # Not a string
                        likely_columns = True
                        break
                
                if likely_columns:
                    errors.append(f'Statement {statement_idx + 1}: SELECT statement appears to select column names but missing FROM clause')
                    details.append({
                        'type': 'missing_from_columns',
                        'message': 'SELECT statement appears to select column names but missing FROM clause',
                        'position': 1,
                        'token': 'FROM'
                    })
        
        # Check for incomplete INSERT statements
        elif first_token == 'INSERT':
            has_into = any(token.value.upper() == 'INTO' for token in meaningful_tokens)
            has_values = any(token.value.upper() in ['VALUES', 'SELECT'] for token in meaningful_tokens)
            
            if not has_into:
                errors.append(f'Statement {statement_idx + 1}: INSERT statement missing INTO clause')
                details.append({
                    'type': 'missing_into',
                    'message': 'INSERT statement missing INTO clause',
                    'position': 1,
                    'token': 'INTO'
                })
            
            if not has_values:
                errors.append(f'Statement {statement_idx + 1}: INSERT statement missing VALUES or SELECT clause')
                details.append({
                    'type': 'missing_values',
                    'message': 'INSERT statement missing VALUES or SELECT clause',
                    'position': len(meaningful_tokens) - 1,
                    'token': 'VALUES'
                })
        
        # Check for incomplete UPDATE statements
        elif first_token == 'UPDATE':
            has_set = any(token.value.upper() == 'SET' for token in meaningful_tokens)
            
            if not has_set:
                errors.append(f'Statement {statement_idx + 1}: UPDATE statement missing SET clause')
                details.append({
                    'type': 'missing_set',
                    'message': 'UPDATE statement missing SET clause',
                    'position': len(meaningful_tokens) - 1,
                    'token': 'SET'
                })
        
        return {'errors': errors, 'warnings': warnings, 'details': details}
    
    def minify_sql(self, sql_text):
        """
        Minify SQL by removing unnecessary whitespace and comments.
        
        Args:
            sql_text (str): SQL text to minify
            
        Returns:
            str: Minified SQL
        """
        try:
            minified = sqlparse.format(
                sql_text,
                strip_comments=True,
                strip_whitespace=True,
                reindent=False
            )
            
            # Further compression - remove extra spaces
            lines = minified.split('\n')
            compressed_lines = []
            
            for line in lines:
                stripped = ' '.join(line.split())  # Normalize whitespace
                if stripped:
                    compressed_lines.append(stripped)
            
            return ' '.join(compressed_lines)
            
        except Exception:
            # Return original if minification fails
            return sql_text
    
    def get_sql_keywords(self):
        """Return list of SQL keywords for syntax highlighting."""
        return list(K.KEYWORDS.keys())


# Example usage and testing
if __name__ == "__main__":
    formatter = SQLFormatter()
    
    # Test SQL
    messy_sql = """
    select u.id,u.name,count(*) as order_count from users u left join orders o on u.id=o.user_id where u.active=1 and o.created_at>'2023-01-01' group by u.id,u.name having count(*)>5 order by order_count desc;
    """
    
    result = formatter.format_sql(messy_sql)
    print("Formatted SQL:")
    print(result['formatted_sql'])
    print(f"\nOriginal length: {result['original_length']}")
    print(f"Formatted length: {result['formatted_length']}")
    
    # Test validation
    validation = formatter.validate_sql(messy_sql)
    print(f"\nValidation - Is valid: {validation['is_valid']}")
    if validation['errors']:
        print(f"Errors: {validation['errors']}")
    if validation['warnings']:
        print(f"Warnings: {validation['warnings']}")