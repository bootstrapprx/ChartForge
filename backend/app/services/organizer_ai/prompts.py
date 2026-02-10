SYSTEM_PROMPT = """
You classify accounting descriptions. You output ONLY valid JSON with the keys: category, parent, type, nature, confidence, reasoning. Do not explain anything outside JSON.
"""

FEW_SHOT_EXAMPLES = """
[
  {
    "input": "Cash received from customer",
    "output": {
      "category": "Asset",
      "parent": "Cash and Cash Equivalents",
      "type": "Current Asset",
      "nature": "Debit",
      "confidence": 0.95,
      "reasoning": "The description mentions 'Cash received', which directly relates to an increase in the company's cash assets."
    }
  },
  {
    "input": "Payment for monthly office rent",
    "output": {
      "category": "Expense",
      "parent": "Operating Expenses",
      "type": "Expense",
      "nature": "Debit",
      "confidence": 0.98,
      "reasoning": "'Rent payment' is a standard operating expense required for business operations."
    }
  },
  {
    "input": "Interest income from bank savings",
    "output": {
      "category": "Revenue",
      "parent": "Financial Income",
      "type": "Income",
      "nature": "Credit",
      "confidence": 0.97,
      "reasoning": "'Interest income' is a form of revenue generated from financial assets, not core operations."
    }
  },
  {
    "input": "Purchase of new office computers",
    "output": {
        "category": "Asset",
        "parent": "Property, Plant, and Equipment",
        "type": "Non-current Asset",
        "nature": "Debit",
        "confidence": 0.9,
        "reasoning": "Purchase of computers represents a long-term asset (Property, Plant, and Equipment)."
    }
  }
]
"""

def create_prompt(text: str, dynamic_examples: str = "") -> str:
    """
    Creates a few-shot prompt for the Ollama model, including dynamic examples from memory.
    """
    
    # Combine static and dynamic examples
    all_examples = FEW_SHOT_EXAMPLES
    if dynamic_examples:
        # A simple way to combine them. More sophisticated merging could be done.
        all_examples = dynamic_examples # Prioritize dynamic examples

    return f"""
{SYSTEM_PROMPT}

Here are some examples:
{all_examples}

Now classify the following description:
"{text}"
"""