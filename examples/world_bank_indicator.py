"""Example: fetch a public economic indicator without API credentials."""

from helpful_support.http_client import JSONClient


def fetch_indicator(country: str = "PER", indicator: str = "NY.GDP.MKTP.CD") -> list[dict]:
    client = JSONClient("https://api.worldbank.org/v2")
    payload = client.get(
        f"country/{country}/indicator/{indicator}",
        params={"format": "json", "per_page": 10},
    )
    if not isinstance(payload, list) or len(payload) < 2:
        return []
    return [
        {"country": item["country"]["value"], "year": item["date"], "value": item["value"]}
        for item in payload[1]
    ]


if __name__ == "__main__":
    for row in fetch_indicator()[:5]:
        print(row)
