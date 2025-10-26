import { useState, useEffect } from 'react';
import profileApi from '../../../api/profileApi';

// Transform API response data to select options
const transformOptions = (data) => {
  if (!data) return [];
  return Object.keys(data).map((id) => ({
    value: id,
    label: data[id],
  }));
};

export const useAddress = () => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await profileApi.getAddressProvinces();
        setProvinces(transformOptions(response.data.data));
      } catch (error) {
        console.error("Failed to load provinces:", error);
      }
    };
    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict("");
      return;
    }

    const loadDistricts = async () => {
      setIsLoadingDistricts(true);
      try {
        const response = await profileApi.getAddressDistricts(selectedProvince);
        setDistricts(transformOptions(response.data.data));
      } catch (error) {
        console.error("Failed to load districts:", error);
        setDistricts([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    const timeoutId = setTimeout(loadDistricts, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedProvince]);

  // Load wards when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard("");
      return;
    }

    const loadWards = async () => {
      setIsLoadingWards(true);
      try {
        const response = await profileApi.getAddressWards(selectedDistrict);
        setWards(transformOptions(response.data.data));
      } catch (error) {
        console.error("Failed to load wards:", error);
        setWards([]);
      } finally {
        setIsLoadingWards(false);
      }
    };

    const timeoutId = setTimeout(loadWards, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedDistrict]);

  return {
    provinces,
    districts,
    wards,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    setSelectedProvince,
    setSelectedDistrict,
    setSelectedWard,
    isLoadingDistricts,
    isLoadingWards,
  };
};