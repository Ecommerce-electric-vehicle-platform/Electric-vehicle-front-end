import React from 'react';
import {
    Clock,
    CheckCircle,
    Truck,
    Package,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import './OrderStatus.css';

const OrderStatus = ({ status, currentStep = 0 }) => {
    const statusConfig = {
        pending: {
            title: 'Chờ xác nhận',
            description: 'Đơn hàng đang chờ xác nhận từ người bán',
            icon: Clock,
            color: '#ffc107',
            step: 1
        },
        confirmed: {
            title: 'Đã xác nhận',
            description: 'Đơn hàng đã được xác nhận và đang chuẩn bị',
            icon: CheckCircle,
            color: '#17a2b8',
            step: 2
        },
        shipping: {
            title: 'Đang giao hàng',
            description: 'Đơn hàng đang được vận chuyển đến bạn',
            icon: Truck,
            color: '#007bff',
            step: 3
        },
        delivered: {
            title: 'Đã giao hàng',
            description: 'Đơn hàng đã được giao thành công',
            icon: Package,
            color: '#28a745',
            step: 4
        },
        cancelled: {
            title: 'Đã hủy',
            description: 'Đơn hàng đã bị hủy',
            icon: AlertCircle,
            color: '#dc3545',
            step: 0
        }
    };

    const steps = [
        { key: 'pending', label: 'Chờ xác nhận' },
        { key: 'confirmed', label: 'Đã xác nhận' },
        { key: 'shipping', label: 'Đang giao hàng' },
        { key: 'delivered', label: 'Đã giao hàng' }
    ];

    const currentStatus = statusConfig[status] || statusConfig.pending;
    const IconComponent = currentStatus.icon;

    return (
        <div className="order-status">
            {/* Current Status */}
            <div className="current-status">
                <div className="status-icon" style={{ backgroundColor: currentStatus.color }}>
                    <IconComponent size={24} color="white" />
                </div>
                <div className="status-info">
                    <h3 className="status-title">{currentStatus.title}</h3>
                    <p className="status-description">{currentStatus.description}</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="status-progress">
                {steps.map((step, index) => {
                    const stepStatus = statusConfig[step.key];
                    const isCompleted = currentStatus.step > stepStatus.step;
                    const isCurrent = currentStatus.step === stepStatus.step && status !== 'cancelled';
                    const StepIcon = stepStatus.icon;

                    return (
                        <div key={step.key} className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                            <div className="step-icon">
                                {isCompleted ? (
                                    <CheckCircle2 size={20} color="white" />
                                ) : (
                                    <StepIcon size={20} color={isCurrent ? 'white' : '#6c757d'} />
                                )}
                            </div>
                            <div className="step-label">{step.label}</div>
                            {index < steps.length - 1 && (
                                <div className={`step-connector ${isCompleted ? 'completed' : ''}`}></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Status Details */}
            <div className="status-details">
                {status === 'pending' && (
                    <div className="status-note">
                        <AlertCircle size={16} color="#ffc107" />
                        <span>Đơn hàng sẽ được xác nhận trong vòng 24 giờ</span>
                    </div>
                )}
                {status === 'confirmed' && (
                    <div className="status-note">
                        <CheckCircle size={16} color="#17a2b8" />
                        <span>Đơn hàng đang được chuẩn bị để giao</span>
                    </div>
                )}
                {status === 'shipping' && (
                    <div className="status-note">
                        <Truck size={16} color="#007bff" />
                        <span>Đơn hàng đang trên đường đến bạn</span>
                    </div>
                )}
                {status === 'delivered' && (
                    <div className="status-note success">
                        <CheckCircle2 size={16} color="#28a745" />
                        <span>Đơn hàng đã được giao thành công</span>
                    </div>
                )}
                {status === 'cancelled' && (
                    <div className="status-note error">
                        <AlertCircle size={16} color="#dc3545" />
                        <span>Đơn hàng đã bị hủy</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderStatus;
