"""Canonical URL mappings for official Bureau of Indian Standards (BIS) sections."""

BIS_BASE_URL = "https://www.bis.gov.in"
BIS_STANDARDS_URL = "https://standards.bis.gov.in/website"

CATEGORY_ROUTES = {
    "hallmarking": f"{BIS_BASE_URL}/hallmarking/?lang=en",
    "product-certification": f"{BIS_BASE_URL}/product-certification/?lang=en",
    "registration-scheme": f"{BIS_BASE_URL}/registration-scheme/?lang=en",
    "fmcs": f"{BIS_BASE_URL}/fmcs/?lang=en",
    "laboratory-services": f"{BIS_BASE_URL}/laboratory-services/?lang=en",
    "standards": BIS_STANDARDS_URL,
    "consumer-engagement": f"{BIS_BASE_URL}/consumer-engagement/?lang=en",
    "general": f"{BIS_BASE_URL}/?lang=en",
}

DEFAULT_URL = f"{BIS_BASE_URL}/?lang=en"


def get_target_url(category: str) -> str:
    """Returns the canonical target URL for a given category."""
    return CATEGORY_ROUTES.get(category.lower().strip(), DEFAULT_URL)
