/**
 * SQL Snippets - Utility functions for SQL code snippets
 * Provides common SQL patterns, examples, and snippet management
 */

class SQLSnippets {
    constructor() {
        this.snippets = this.getBuiltInSnippets();
        this.customSnippets = this.loadCustomSnippets();
    }

    /**
     * Get built-in SQL snippets for common patterns
     */
    getBuiltInSnippets() {
        return {
            // Basic queries
            'basic-select': {
                name: 'Basic SELECT',
                description: 'Simple SELECT statement',
                category: 'Basic',
                sql: `SELECT column1, column2, column3
FROM table_name
WHERE condition = 'value'
ORDER BY column1 ASC;`
            },

            'select-join': {
                name: 'SELECT with JOIN',
                description: 'SELECT with INNER JOIN',
                category: 'Joins',
                sql: `SELECT u.id, u.name, p.title
FROM users u
INNER JOIN posts p ON u.id = p.user_id
WHERE u.active = 1
ORDER BY p.created_at DESC;`
            },

            'left-join': {
                name: 'LEFT JOIN',
                description: 'SELECT with LEFT JOIN',
                category: 'Joins',
                sql: `SELECT u.id, u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 0
ORDER BY order_count DESC;`
            },

            // Aggregations
            'group-by': {
                name: 'GROUP BY with aggregation',
                description: 'Grouping with COUNT, SUM, AVG',
                category: 'Aggregation',
                sql: `SELECT 
    category,
    COUNT(*) as total_products,
    AVG(price) as avg_price,
    SUM(quantity) as total_quantity
FROM products
WHERE active = 1
GROUP BY category
HAVING COUNT(*) > 10
ORDER BY total_products DESC;`
            },

            'window-function': {
                name: 'Window Function',
                description: 'ROW_NUMBER and ranking functions',
                category: 'Advanced',
                sql: `SELECT 
    id,
    name,
    salary,
    department,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as rank_in_dept,
    AVG(salary) OVER (PARTITION BY department) as dept_avg_salary
FROM employees
ORDER BY department, rank_in_dept;`
            },

            // CTE and subqueries
            'cte-basic': {
                name: 'Common Table Expression (CTE)',
                description: 'Basic CTE example',
                category: 'Advanced',
                sql: `WITH high_value_customers AS (
    SELECT 
        customer_id,
        SUM(order_total) as total_spent
    FROM orders
    WHERE order_date >= '2023-01-01'
    GROUP BY customer_id
    HAVING SUM(order_total) > 1000
)
SELECT 
    c.name,
    c.email,
    hvc.total_spent
FROM customers c
INNER JOIN high_value_customers hvc ON c.id = hvc.customer_id
ORDER BY hvc.total_spent DESC;`
            },

            'recursive-cte': {
                name: 'Recursive CTE',
                description: 'Recursive Common Table Expression',
                category: 'Advanced',
                sql: `WITH RECURSIVE employee_hierarchy AS (
    -- Base case: top-level managers
    SELECT 
        id, 
        name, 
        manager_id, 
        1 as level,
        CAST(name AS VARCHAR(1000)) as path
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive case: employees with managers
    SELECT 
        e.id, 
        e.name, 
        e.manager_id, 
        eh.level + 1,
        CONCAT(eh.path, ' > ', e.name)
    FROM employees e
    INNER JOIN employee_hierarchy eh ON e.manager_id = eh.id
)
SELECT * FROM employee_hierarchy
ORDER BY level, name;`
            },

            // Data modification
            'insert-multiple': {
                name: 'INSERT multiple rows',
                description: 'Insert multiple rows at once',
                category: 'DML',
                sql: `INSERT INTO products (name, category, price, quantity)
VALUES 
    ('Laptop Pro', 'Electronics', 1299.99, 50),
    ('Wireless Mouse', 'Electronics', 29.99, 200),
    ('Office Chair', 'Furniture', 199.99, 75),
    ('Desk Lamp', 'Furniture', 49.99, 100);`
            },

            'update-join': {
                name: 'UPDATE with JOIN',
                description: 'Update using data from another table',
                category: 'DML',
                sql: `UPDATE products p
SET 
    p.category_name = c.name,
    p.updated_at = CURRENT_TIMESTAMP
FROM categories c
WHERE p.category_id = c.id
  AND c.active = 1;`
            },

            'upsert': {
                name: 'UPSERT (INSERT ON CONFLICT)',
                description: 'Insert or update if exists',
                category: 'DML',
                sql: `INSERT INTO user_stats (user_id, login_count, last_login)
VALUES (1, 1, CURRENT_TIMESTAMP)
ON CONFLICT (user_id)
DO UPDATE SET
    login_count = user_stats.login_count + 1,
    last_login = CURRENT_TIMESTAMP;`
            },

            // DDL
            'create-table': {
                name: 'CREATE TABLE',
                description: 'Create table with constraints',
                category: 'DDL',
                sql: `CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
);`
            },

            'create-index': {
                name: 'CREATE INDEX',
                description: 'Create indexes for performance',
                category: 'DDL',
                sql: `-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date);

-- Partial index
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- Expression index
CREATE INDEX idx_users_lower_email ON users(LOWER(email));`
            },

            // Performance and analysis
            'explain-query': {
                name: 'EXPLAIN ANALYZE',
                description: 'Query performance analysis',
                category: 'Performance',
                sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2023-01-01'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC
LIMIT 100;`
            },

            'table-stats': {
                name: 'Table Statistics',
                description: 'Get table size and row count info',
                category: 'Analysis',
                sql: `SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY tablename, attname;`
            },

            // Date and time
            'date-functions': {
                name: 'Date Functions',
                description: 'Common date/time operations',
                category: 'Functions',
                sql: `SELECT 
    -- Current date/time
    CURRENT_DATE as today,
    CURRENT_TIMESTAMP as now,
    
    -- Date arithmetic
    CURRENT_DATE - INTERVAL '30 days' as thirty_days_ago,
    CURRENT_DATE + INTERVAL '1 month' as next_month,
    
    -- Date formatting
    TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS') as formatted_timestamp,
    
    -- Date parts
    EXTRACT(YEAR FROM CURRENT_DATE) as current_year,
    EXTRACT(MONTH FROM CURRENT_DATE) as current_month,
    EXTRACT(DOW FROM CURRENT_DATE) as day_of_week,
    
    -- Age calculation
    AGE(CURRENT_DATE, '1990-01-01'::date) as age_from_1990;`
            }
        };
    }

    /**
     * Get snippet by ID
     */
    getSnippet(id) {
        return this.snippets[id] || this.customSnippets[id] || null;
    }

    /**
     * Get all snippets
     */
    getAllSnippets() {
        return { ...this.snippets, ...this.customSnippets };
    }

    /**
     * Get snippets by category
     */
    getSnippetsByCategory(category) {
        const allSnippets = this.getAllSnippets();
        return Object.entries(allSnippets)
            .filter(([id, snippet]) => snippet.category === category)
            .reduce((acc, [id, snippet]) => {
                acc[id] = snippet;
                return acc;
            }, {});
    }

    /**
     * Get all categories
     */
    getCategories() {
        const allSnippets = this.getAllSnippets();
        const categories = new Set();
        
        Object.values(allSnippets).forEach(snippet => {
            categories.add(snippet.category);
        });
        
        return Array.from(categories).sort();
    }

    /**
     * Search snippets by name or description
     */
    searchSnippets(query) {
        const allSnippets = this.getAllSnippets();
        const lowerQuery = query.toLowerCase();
        
        return Object.entries(allSnippets)
            .filter(([id, snippet]) => 
                snippet.name.toLowerCase().includes(lowerQuery) ||
                snippet.description.toLowerCase().includes(lowerQuery) ||
                snippet.sql.toLowerCase().includes(lowerQuery)
            )
            .reduce((acc, [id, snippet]) => {
                acc[id] = snippet;
                return acc;
            }, {});
    }

    /**
     * Add custom snippet
     */
    addCustomSnippet(id, snippet) {
        if (!snippet.name || !snippet.sql) {
            throw new Error('Snippet must have name and sql properties');
        }

        const customSnippet = {
            name: snippet.name,
            description: snippet.description || '',
            category: snippet.category || 'Custom',
            sql: snippet.sql,
            custom: true,
            created_at: new Date().toISOString()
        };

        this.customSnippets[id] = customSnippet;
        this.saveCustomSnippets();
        
        return customSnippet;
    }

    /**
     * Update custom snippet
     */
    updateCustomSnippet(id, updates) {
        if (!this.customSnippets[id]) {
            throw new Error('Custom snippet not found');
        }

        this.customSnippets[id] = {
            ...this.customSnippets[id],
            ...updates,
            updated_at: new Date().toISOString()
        };

        this.saveCustomSnippets();
        return this.customSnippets[id];
    }

    /**
     * Delete custom snippet
     */
    deleteCustomSnippet(id) {
        if (!this.customSnippets[id]) {
            throw new Error('Custom snippet not found');
        }

        delete this.customSnippets[id];
        this.saveCustomSnippets();
    }

    /**
     * Load custom snippets from localStorage
     */
    loadCustomSnippets() {
        try {
            const saved = localStorage.getItem('sqlFormatter_customSnippets');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load custom snippets:', error);
            return {};
        }
    }

    /**
     * Save custom snippets to localStorage
     */
    saveCustomSnippets() {
        try {
            localStorage.setItem('sqlFormatter_customSnippets', JSON.stringify(this.customSnippets));
        } catch (error) {
            console.warn('Failed to save custom snippets:', error);
        }
    }

    /**
     * Generate random sample data SQL
     */
    generateSampleData(tableName, columns, rowCount = 10) {
        const generateValue = (column) => {
            switch (column.type.toLowerCase()) {
                case 'int':
                case 'integer':
                    return Math.floor(Math.random() * 1000) + 1;
                case 'varchar':
                case 'text':
                case 'string':
                    return `'Sample ${Math.random().toString(36).substring(7)}'`;
                case 'boolean':
                case 'bool':
                    return Math.random() > 0.5 ? 'true' : 'false';
                case 'date':
                    const date = new Date();
                    date.setDate(date.getDate() - Math.floor(Math.random() * 365));
                    return `'${date.toISOString().split('T')[0]}'`;
                case 'timestamp':
                    const timestamp = new Date();
                    timestamp.setTime(timestamp.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
                    return `'${timestamp.toISOString()}'`;
                case 'decimal':
                case 'float':
                    return (Math.random() * 1000).toFixed(2);
                default:
                    return `'value_${Math.random().toString(36).substring(7)}'`;
            }
        };

        const columnNames = columns.map(col => col.name).join(', ');
        const values = [];

        for (let i = 0; i < rowCount; i++) {
            const rowValues = columns.map(generateValue).join(', ');
            values.push(`    (${rowValues})`);
        }

        return `INSERT INTO ${tableName} (${columnNames})
VALUES
${values.join(',\n')};`;
    }

    /**
     * Format SQL snippet for display
     */
    formatSnippetForDisplay(snippet) {
        return {
            ...snippet,
            preview: snippet.sql.substring(0, 100) + (snippet.sql.length > 100 ? '...' : ''),
            lineCount: snippet.sql.split('\n').length,
            charCount: snippet.sql.length
        };
    }

    /**
     * Export all snippets
     */
    exportSnippets() {
        const allSnippets = this.getAllSnippets();
        const exportData = {
            version: '1.0',
            exported_at: new Date().toISOString(),
            snippets: allSnippets
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import snippets from JSON
     */
    importSnippets(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (!data.snippets) {
                throw new Error('Invalid import format');
            }

            let imported = 0;
            Object.entries(data.snippets).forEach(([id, snippet]) => {
                if (snippet.custom !== false) { // Only import custom snippets
                    this.customSnippets[id] = {
                        ...snippet,
                        custom: true,
                        imported_at: new Date().toISOString()
                    };
                    imported++;
                }
            });

            this.saveCustomSnippets();
            return imported;

        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }

    /**
     * Get usage statistics
     */
    getStats() {
        const allSnippets = this.getAllSnippets();
        const builtInCount = Object.keys(this.snippets).length;
        const customCount = Object.keys(this.customSnippets).length;
        const categories = this.getCategories();

        return {
            total: builtInCount + customCount,
            builtin: builtInCount,
            custom: customCount,
            categories: categories.length,
            categoryBreakdown: categories.reduce((acc, category) => {
                acc[category] = Object.values(allSnippets)
                    .filter(snippet => snippet.category === category).length;
                return acc;
            }, {})
        };
    }
}

/**
 * SQL Pattern Detector
 * Analyzes SQL and suggests relevant snippets
 */
class SQLPatternDetector {
    constructor(snippets) {
        this.snippets = snippets;
    }

    /**
     * Analyze SQL and suggest related snippets
     */
    suggestSnippets(sql) {
        const suggestions = [];
        const lowerSQL = sql.toLowerCase();

        // Basic patterns
        if (lowerSQL.includes('select') && !lowerSQL.includes('join')) {
            suggestions.push('select-join');
        }

        if (lowerSQL.includes('group by') && !lowerSQL.includes('having')) {
            suggestions.push('group-by');
        }

        if (lowerSQL.includes('with') || lowerSQL.includes('cte')) {
            suggestions.push('cte-basic', 'recursive-cte');
        }

        if (lowerSQL.includes('window') || lowerSQL.includes('over')) {
            suggestions.push('window-function');
        }

        if (lowerSQL.includes('insert') && !lowerSQL.includes('values')) {
            suggestions.push('insert-multiple');
        }

        if (lowerSQL.includes('explain')) {
            suggestions.push('explain-query');
        }

        // Return actual snippet objects
        return suggestions
            .map(id => this.snippets.getSnippet(id))
            .filter(snippet => snippet !== null);
    }

    /**
     * Detect SQL complexity level
     */
    detectComplexity(sql) {
        const lowerSQL = sql.toLowerCase();
        let score = 0;

        // Basic SQL elements
        if (lowerSQL.includes('select')) score += 1;
        if (lowerSQL.includes('where')) score += 1;
        if (lowerSQL.includes('order by')) score += 1;

        // Intermediate elements
        if (lowerSQL.includes('join')) score += 2;
        if (lowerSQL.includes('group by')) score += 2;
        if (lowerSQL.includes('having')) score += 2;

        // Advanced elements
        if (lowerSQL.includes('with')) score += 3;
        if (lowerSQL.includes('window') || lowerSQL.includes('over')) score += 3;
        if (lowerSQL.includes('recursive')) score += 4;

        if (score <= 3) return 'beginner';
        if (score <= 7) return 'intermediate';
        return 'advanced';
    }
}

// Initialize global instances
const sqlSnippets = new SQLSnippets();
const patternDetector = new SQLPatternDetector(sqlSnippets);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SQLSnippets, SQLPatternDetector, sqlSnippets, patternDetector };
} else {
    // Browser environment
    window.SQLSnippets = SQLSnippets;
    window.SQLPatternDetector = SQLPatternDetector;
    window.sqlSnippets = sqlSnippets;
    window.patternDetector = patternDetector;
}

// Debug helpers for development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.snippetsDebug = {
        getSnippets: () => sqlSnippets.getAllSnippets(),
        searchSnippets: (query) => sqlSnippets.searchSnippets(query),
        getStats: () => sqlSnippets.getStats(),
        suggestSnippets: (sql) => patternDetector.suggestSnippets(sql),
        detectComplexity: (sql) => patternDetector.detectComplexity(sql),
        generateSample: () => sqlSnippets.generateSampleData('users', [
            {name: 'id', type: 'int'},
            {name: 'name', type: 'varchar'},
            {name: 'email', type: 'varchar'},
            {name: 'created_at', type: 'timestamp'}
        ], 5)
    };
    
    console.log('🔧 Snippets Debug tools available: window.snippetsDebug');
}