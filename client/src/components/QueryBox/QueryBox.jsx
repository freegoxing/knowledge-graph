import { useState } from 'react';
import styles from './QueryBox.module.css';

export default function QueryBox({onResult}) {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setResponse('');

        try {
            const res = await fetch('http://localhost:3001/api/graph', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });

            const data = await res.json();

            if (data.error) {
                setError(data.error);
            } else {
                // setResponse(JSON.stringify(data, null, 2)); // 格式化显示 JSON
                if (onResult) onResult(data);
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('请求被取消');
                // 这里可以不设置错误信息，因为是正常取消
            } else {
                setError('请求失败，请检查网络或后端服务。');
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.queryBox}>
            <input
                type="text"
                placeholder="请输入你要查询的内容"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={handleSearch} disabled={loading}>
                {loading ? '查询中...' : '查询'}
            </button>

            {error && <div className={styles.error}>❌ {error}</div>}
            {response && (
                <pre className={styles.response}>
          {response}
        </pre>
            )}
        </div>
    );
}
