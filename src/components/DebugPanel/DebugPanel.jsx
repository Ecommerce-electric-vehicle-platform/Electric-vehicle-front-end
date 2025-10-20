import React, { useEffect, useState } from 'react';
import { fetchPostProducts } from '../../api/productApi';
import './DebugPanel.css';

function DebugPanel() {
    const [debugData, setDebugData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadDebugData = async () => {
            setLoading(true);
            try {
                const result = await fetchPostProducts({ page: 1, size: 3 });
                setDebugData(result);
            } catch (error) {
                console.error('Debug API Error:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDebugData();
    }, []);

    if (loading) return <div>Đang tải debug data...</div>;

    return (
        <div className="debug-panel" style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'white',
            border: '2px solid #ccc',
            padding: '10px',
            maxWidth: '400px',
            maxHeight: '500px',
            overflow: 'auto',
            zIndex: 9999,
            fontSize: '12px'
        }}>
            <div className="debug-header">
                <h3 className="debug-title">🔍 Debug API Data</h3>
            </div>
            <div className="debug-content">
                {debugData && (
                    <div>
                        <div className="debug-section">
                            <h4 className="debug-section-title">Raw Response:</h4>
                            <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '200px' }}>
                                {JSON.stringify(debugData.raw, null, 2)}
                            </pre>
                        </div>

                        <div className="debug-section">
                            <h4 className="debug-section-title">First Item:</h4>
                            <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '200px' }}>
                                {JSON.stringify(debugData.items[0], null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DebugPanel;
export { DebugPanel };