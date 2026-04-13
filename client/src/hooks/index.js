import { useState, useEffect, useCallback, useRef } from 'react';
import { campaignAPI } from '../services/api';

// ─── useCampaigns ─────────────────────────────────────────────────────────────
export const useCampaigns = (initialParams = {}) => {
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);
  const abortRef = useRef(null);

  const fetchCampaigns = useCallback(async (fetchParams) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const { data } = await campaignAPI.getAll(fetchParams);
      const { campaigns: list, page, totalPages, total } = data.data;
      setCampaigns(list);
      setPagination({ page, totalPages, total });
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(err.response?.data?.message || 'Failed to load campaigns.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns(params);
    return () => abortRef.current?.abort();
  }, [params, fetchCampaigns]);

  const updateParams = useCallback((newParams) => {
    setParams((prev) => ({ ...prev, ...newParams, page: 1 }));
  }, []);

  const goToPage = useCallback((page) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  return { campaigns, pagination, loading, error, params, updateParams, goToPage, refetch: () => fetchCampaigns(params) };
};

// ─── useCampaign ──────────────────────────────────────────────────────────────
export const useCampaign = (id) => {
  const [campaign, setCampaign] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCampaign = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const { data } = await campaignAPI.getById(id);
      setCampaign(data.data.campaign);
      setMissions(data.data.missions);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load campaign.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  return { campaign, missions, loading, error, refetch: fetchCampaign };
};

// ─── useForm ──────────────────────────────────────────────────────────────────
export const useForm = (initialValues, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (touched[name] && validate) {
      const newErrors = validate({ ...values, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: newErrors[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (validate) {
      const newErrors = validate(values);
      setErrors((prev) => ({ ...prev, [name]: newErrors[name] }));
    }
  };

  const validateAll = () => {
    if (!validate) return true;
    const newErrors = validate(values);
    setErrors(newErrors);
    setTouched(Object.keys(values).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return { values, errors, touched, handleChange, handleBlur, validateAll, reset, setValues };
};
