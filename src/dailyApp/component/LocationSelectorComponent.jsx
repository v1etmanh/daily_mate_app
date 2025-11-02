// src/components/ProvinceSelector.jsx
import React, { useState, useEffect } from 'react';

const ProvinceSelector = ({ onProvinceChange, initialProvince, readOnly = false }) => {
    const [provinces, setProvinces] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState(initialProvince || '');

    // Load dữ liệu tỉnh/thành phố
    useEffect(() => {
        fetch('https://raw.githubusercontent.com/madnh/hanhchinhvn/master/dist/tinh_tp.json')
            .then(res => res.json())
            .then(data => setProvinces(Object.values(data)));
    }, []);

    // Set initial values from props
    useEffect(() => {
        setSelectedProvince(initialProvince || '');
    }, [initialProvince]);

    // Gọi callback khi tỉnh thay đổi
    useEffect(() => {
        if (onProvinceChange && !readOnly) {
            const provinceName = provinces.find(p => p.code === selectedProvince)?.name || '';
            onProvinceChange(provinceName);
        }
    }, [selectedProvince, provinces, readOnly]);

    const handleProvinceChange = (e) => {
        if (readOnly) return;
        setSelectedProvince(e.target.value);
    };

    // Hàm để lấy tên tỉnh từ code
    const getProvinceName = (code) => {
        if (!code) return '';
        return provinces.find(p => p.code === code)?.name || '';
    };

    if (readOnly) {
        // Nếu ở chế độ chỉ đọc, hiển thị tên tỉnh
        const provinceName = getProvinceName(initialProvince);
        return <div className="province-display-readonly">{provinceName || "Chưa chọn tỉnh/thành phố"}</div>;
    }

    return (
        <div className="province-selector">
            {/* Tỉnh/Thành phố */}
            <select
                value={selectedProvince}
                onChange={handleProvinceChange}
                className="form-control"
                disabled={readOnly}
            >
                <option value="">Chọn Tỉnh/Thành phố</option>
                {provinces.map(province => (
                    <option key={province.code} value={province.code}>
                        {province.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ProvinceSelector;