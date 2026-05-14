import json
from pathlib import Path


def patch_file(path: Path, js_code: str) -> tuple[int, int]:
    data = json.loads(path.read_text(encoding="utf-8"))
    node = next(n for n in data[0]["nodes"] if n.get("name") == "Build Response Code")
    old_len = len(node["parameters"]["jsCode"])
    node["parameters"]["jsCode"] = js_code
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return old_len, len(js_code)


def main() -> None:
    js = Path("tmp-js-code.js").read_text(encoding="utf-8")
    targets = [
        Path("n8n-workflows-updated.json"),
        Path("n8n-workflows-export-pretty.json"),
        Path("exported-workflow-published.json"),
    ]
    for p in targets:
        old_len, new_len = patch_file(p, js)
        print(f"patched {p}: {old_len} -> {new_len}")


if __name__ == "__main__":
    main()
