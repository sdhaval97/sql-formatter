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
        Basic SQL syntax validation.
        
        Args:
            sql_text (str): SQL text to validate
            
        Returns:
            dict: {
                'is_valid': bool,
                'errors': list of str,
                'warnings': list of str
            }
        """
        if not sql_text or not sql_text.strip():
            return {
                'is_valid': False,
                'errors': ['Empty SQL provided'],
                'warnings': []
            }
        
        try:
            # Parse the SQL
            parsed = sqlparse.parse(sql_text)
            
            errors = []
            warnings = []
            
            # Basic validation checks
            if not parsed:
                errors.append('Unable to parse SQL statement')
            else:
                for statement in parsed:
                    # Check for common issues
                    tokens = list(statement.flatten())
                    
                    # Check for unmatched parentheses
                    paren_count = 0
                    for token in tokens:
                        if token.ttype is T.Punctuation:
                            if token.value == '(':
                                paren_count += 1
                            elif token.value == ')':
                                paren_count -= 1
                    
                    if paren_count != 0:
                        errors.append('Unmatched parentheses detected')
                    
                    # Check for incomplete statements
                    meaningful_tokens = [t for t in tokens if t.ttype not in T.Whitespace]
                    if meaningful_tokens and meaningful_tokens[-1].value != ';':
                        warnings.append('Statement may be missing semicolon')
            
            return {
                'is_valid': len(errors) == 0,
                'errors': errors,
                'warnings': warnings
            }
            
        except Exception as e:
            return {
                'is_valid': False,
                'errors': [f'Validation error: {str(e)}'],
                'warnings': []
            }
    
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