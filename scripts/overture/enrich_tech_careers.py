"""Discover and persist supported ATS boards for Overture tech listings."""
from __future__ import annotations

import argparse
import base64
import html
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from xml.etree import ElementTree
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote_plus, unquote, urljoin, urlparse
from urllib.request import Request, urlopen

ATS_HOSTS = {
    "boards.greenhouse.io": "greenhouse",
    "job-boards.greenhouse.io": "greenhouse",
    "jobs.lever.co": "lever",
    "jobs.ashbyhq.com": "ashby",
    "careers.smartrecruiters.com": "smartrecruiters",
    "jobs.smartrecruiters.com": "smartrecruiters",
}


def request_text(url: str, timeout: int = 15) -> str:
    request = Request(url, headers={
        "Accept": "text/html,application/xhtml+xml",
        "User-Agent": "LocaToGo-Tech-Atlas/1.0 career-url-enrichment",
    })
    with urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def request_json(url: str, timeout: int = 15) -> object:
    request = Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "LocaToGo-Tech-Atlas/1.0 career-url-enrichment",
    })
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


class LinkParser(HTMLParser):
    def __init__(self, base_url: str):
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        href = dict(attrs).get("href")
        if href:
            self.links.append(urljoin(self.base_url, html.unescape(href)))


def unwrap_search_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.hostname and parsed.hostname.endswith("duckduckgo.com"):
        redirected = parse_qs(parsed.query).get("uddg", [None])[0]
        if redirected:
            return unquote(redirected)
    if parsed.hostname and parsed.hostname.endswith("bing.com"):
        encoded = parse_qs(parsed.query).get("u", [None])[0]
        if encoded and encoded.startswith("a1"):
            try:
                padded = encoded[2:] + "=" * (-len(encoded[2:]) % 4)
                return base64.urlsafe_b64decode(padded).decode("utf-8")
            except (ValueError, UnicodeDecodeError):
                pass
    return value


def board_from_url(value: str | None) -> tuple[str, str, str] | None:
    if not value:
        return None
    try:
        parsed = urlparse(value)
    except ValueError:
        return None
    host = (parsed.hostname or "").lower().removeprefix("www.")
    provider = ATS_HOSTS.get(host)
    token = next((part for part in parsed.path.split("/") if part), None)
    if not provider or not token or token == "embed":
        return None
    return provider, token, f"https://{host}/{token}"


def candidate_board_urls(html_text: str, base_url: str) -> list[str]:
    parser = LinkParser(base_url)
    parser.feed(html_text)
    candidates: list[str] = []
    for link in parser.links:
        if board_from_url(link) and link not in candidates:
            candidates.append(link)
    return candidates


def search_board_urls(title: str, website: str | None, city: str | None) -> list[str]:
    query_parts = [f'"{title}"', "careers"]
    if city:
        query_parts.append(city)
    if website:
        host = urlparse(website if website.startswith("http") else f"https://{website}").hostname
        if host:
            query_parts.append(host.removeprefix("www."))
    query = quote_plus(" ".join(query_parts))
    candidates: list[str] = []
    try:
        rss = request_text(f"https://www.bing.com/search?format=rss&q={query}")
        for item in ElementTree.fromstring(rss).findall(".//item/link"):
            if item.text and board_from_url(item.text) and item.text not in candidates:
                candidates.append(item.text)
    except (ElementTree.ParseError, HTTPError, URLError, TimeoutError, OSError):
        pass
    for search_url in (
        f"https://www.bing.com/search?q={query}",
        f"https://www.bing.com/search?q={quote_plus(f'\"{title}\" (Greenhouse OR Lever OR Ashby OR SmartRecruiters)')}",
    ):
        try:
            results = request_text(search_url)
        except (HTTPError, URLError, TimeoutError, OSError):
            continue
        parser = LinkParser("https://www.bing.com")
        parser.feed(results)
        for link in parser.links:
            unwrapped = unwrap_search_url(link)
            if board_from_url(unwrapped) and unwrapped not in candidates:
                candidates.append(unwrapped)
    return candidates


def board_is_live(board: tuple[str, str, str]) -> bool:
    provider, token, _ = board
    endpoints = {
        "greenhouse": f"https://boards-api.greenhouse.io/v1/boards/{quote_plus(token)}/jobs",
        "lever": f"https://api.lever.co/v0/postings/{quote_plus(token)}?mode=json",
        "ashby": f"https://api.ashbyhq.com/posting-api/job-board/{quote_plus(token)}",
        "smartrecruiters": f"https://api.smartrecruiters.com/v1/companies/{quote_plus(token)}/postings?limit=1",
    }
    try:
        request_json(endpoints[provider])
        return True
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError):
        return False


def discover_board(title: str, website: str | None, city: str | None) -> str | None:
    direct_candidates: list[str] = []
    if website:
        normalized = website if website.startswith("http") else f"https://{website}"
        try:
            direct_candidates = candidate_board_urls(request_text(normalized), normalized)
        except (HTTPError, URLError, TimeoutError, ValueError, OSError):
            pass
    candidates = direct_candidates + search_board_urls(title, website, city)
    seen: set[str] = set()
    for candidate in candidates:
        board = board_from_url(candidate)
        if not board or board[2] in seen:
            continue
        seen.add(board[2])
        if board_is_live(board):
            return board[2]
    return None


def load_env() -> tuple[str, str]:
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not (url and key):
        env_file = os.environ.get("MAPORA_ENV_FILE", ".env")
        if os.path.exists(env_file):
            with open(env_file, encoding="utf-8") as file:
                for line in file:
                    line = line.strip()
                    if line.startswith("#") or "=" not in line:
                        continue
                    name, value = line.split("=", 1)
                    value = value.strip().strip("'\"")
                    if name.strip() in {"SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"} and not url:
                        url = value
                    elif name.strip() == "SUPABASE_SERVICE_ROLE_KEY" and not key:
                        key = value
    if not url or not key:
        raise RuntimeError("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    return url.rstrip("/"), key


def supabase_get(url: str, key: str, limit: int) -> list[dict[str, object]]:
    params = "company_type=not.is.null&careers_url=is.null&select=id,title,website,city&order=title&limit=" + str(limit)
    request = Request(f"{url}/rest/v1/listings?{params}", headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
    })
    with urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def supabase_patch(url: str, key: str, listing_id: str, careers_url: str) -> None:
    request = Request(
        f"{url}/rest/v1/listings?id=eq.{listing_id}",
        data=json.dumps({"careers_url": careers_url}).encode("utf-8"),
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="PATCH",
    )
    with urlopen(request, timeout=60) as response:
        response.read()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=1000)
    parser.add_argument("--sleep", type=float, default=0.5, help="Delay between listings")
    parser.add_argument("--workers", type=int, default=8, help="Concurrent discovery workers")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    url, key = load_env()
    rows = supabase_get(url, key, args.limit)
    summary = {"scanned": 0, "updated": 0, "unresolved": 0}
    def resolve(row: dict[str, object]) -> tuple[dict[str, object], str | None]:
        title = str(row.get("title") or "").strip()
        website = row.get("website") if isinstance(row.get("website"), str) else None
        city = row.get("city") if isinstance(row.get("city"), str) else None
        try:
            return row, discover_board(title, website, city)
        except (HTTPError, URLError, TimeoutError, ValueError, OSError):
            return row, None

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        futures = [executor.submit(resolve, row) for row in rows]
        for future in as_completed(futures):
            row, careers_url = future.result()
            summary["scanned"] += 1
            title = str(row.get("title") or "").strip()
            if not careers_url:
                summary["unresolved"] += 1
                continue
            if not args.dry_run:
                supabase_patch(url, key, str(row["id"]), careers_url)
            summary["updated"] += 1
            print(f"{title}\t{careers_url}")
            time.sleep(args.sleep)
    print(json.dumps(summary))


if __name__ == "__main__":
    main()
