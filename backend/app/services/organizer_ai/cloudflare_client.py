import httpx
import json
from typing import Optional
from app.core.config import settings

class CloudflareModel:
    def __init__(self, account_id: str, api_token: str, model_name: str = "@cf/meta/llama-3-8b-instruct"):
        self.account_id = account_id
        self.api_token = api_token
        self.model_name = model_name
        self.api_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model_name}"

    async def infer(self, prompt: str) -> Optional[str]:
        """
        Sends a prompt to Cloudflare Workers AI and returns the response.
        """
        headers = {"Authorization": f"Bearer {self.api_token}"}
        payload = {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant that outputs JSON."},
                {"role": "user", "content": prompt}
            ]
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(self.api_url, headers=headers, json=payload)
                response.raise_for_status()
                result = response.json()
                
                # Cloudflare AI response structure
                if "result" in result and "response" in result["result"]:
                    return result["result"]["response"]
                return None

            except httpx.RequestError as e:
                print(f"Error connecting to Cloudflare AI: {e}")
                return None
            except Exception as e:
                print(f"Error processing Cloudflare AI response: {e}")
                return None

    async def is_available(self) -> bool:
        return bool(self.account_id and self.api_token)
