import { useState, useEffect } from 'react';
import profileApi from '../../../api/profileApi';

const transformOptions = (data) => {
  if (!data) return [];
  return Object.keys(data).map((id) => ({
    value: id,
    label: data[id],
  }));
};

export const useAddressLoading = (selectedProvince, selectedDistrict) => {
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // Load districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      return;
    }

    let timeoutId = null;

    const loadDistricts = async () => {
      setIsLoadingDistricts(true);
      try {
        const response = await profileApi.getAddressDistricts(selectedProvince);
        if (response.data?.data) {
          setDistricts(transformOptions(response.data.data));
        }
      } catch (error) {
        console.error('Failed to load districts:', error);
        setDistricts([]);
      }
      setIsLoadingDistricts(false);
    };

    timeoutId = setTimeout(loadDistricts, 300);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedProvince]);

  // Load wards when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      return;
    }

    let timeoutId = null;

    const loadWards = async () => {
      setIsLoadingWards(true);
      try {
        const response = await profileApi.getAddressWards(selectedDistrict);
        if (response.data?.data) {
          setWards(transformOptions(response.data.data));
        }
      } catch (error) {
        console.error('Failed to load wards:', error);
        setWards([]);
      }
      setIsLoadingWards(false);
    };

    timeoutId = setTimeout(loadWards, 300);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedDistrict]);

  return {
    districts,
    wards,
    isLoadingDistricts,
    isLoadingWards
  };
};