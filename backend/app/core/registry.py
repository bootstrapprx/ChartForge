from typing import Dict, Any, List

class ManualDataRegistry:
    """
    A simple in-memory registry for storing manually provided data,
    acting as a fallback when external integrations are not available.
    
    This is a singleton implementation to ensure data is consistent across
    the application.
    """
    _instance = None
    _data: Dict[str, Any]

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ManualDataRegistry, cls).__new__(cls)
            cls._instance._data = {
                "company_charts": {},
                "master_charts": {},
            }
        return cls._instance

    def get_data(self, key: str, sub_key: Any = None) -> Any:
        """
        Retrieves data from the registry.
        
        :param key: The main data category (e.g., 'company_charts').
        :param sub_key: The specific item to retrieve (e.g., a company_id).
        """
        if sub_key:
            return self._data.get(key, {}).get(sub_key)
        return self._data.get(key)

    def set_data(self, key: str, value: Any, sub_key: Any = None):
        """
        Sets data in the registry.
        
        :param key: The main data category.
        :param value: The data to store.
        :param sub_key: The specific item to store against.
        """
        if sub_key:
            if key not in self._data:
                self._data[key] = {}
            self._data[key][sub_key] = value
        else:
            self._data[key] = value

# Instantiate the registry singleton
manual_data_registry = ManualDataRegistry()
