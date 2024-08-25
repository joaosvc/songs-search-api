import requests
import re
from yt_dlp.jsinterp import JSInterpreter

playerUrl = "https://www.youtube.com/s/player/a87a9450/player_ias.vflset/en_US/base.js";
response = requests.get(playerUrl)

def _search_regex(data: str, regexes: list, group_name: str) -> str:
    for regex in regexes:
        match = re.search(regex, data)
        if match:
            return match.group(1)
    raise ValueError(f"Could not find {group_name} in the provided data")

if response.status_code == 200:
    jscode = response.text

    funcname = _search_regex(
        jscode,
        [
            r'\b[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*encodeURIComponent\s*\(\s*(?P<sig>[a-zA-Z0-9$]+)\(',
            r'\b[a-zA-Z0-9]+\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*encodeURIComponent\s*\(\s*(?P<sig>[a-zA-Z0-9$]+)\(',
            r'\bm=(?P<sig>[a-zA-Z0-9$]{2,})\(decodeURIComponent\(h\.s\)\)',
            r'\bc&&\(c=(?P<sig>[a-zA-Z0-9$]{2,})\(decodeURIComponent\(c\)\)',
            r'(?:\b|[^a-zA-Z0-9$])(?P<sig>[a-zA-Z0-9$]{2,})\s*=\s*function\(\s*a\s*\)\s*{\s*a\s*=\s*a\.split\(\s*""\s*\)(?:;[a-zA-Z0-9$]{2}\.[a-zA-Z0-9$]{2}\(a,\d+\))?',
            r'(?P<sig>[a-zA-Z0-9$]+)\s*=\s*function\(\s*a\s*\)\s*{\s*a\s*=\s*a\.split\(\s*""\s*\)',
            # Padrões obsoletos
            r'("|\')signature\1\s*,\s*(?P<sig>[a-zA-Z0-9$]+)\(',
            r'\.sig\|\|(?P<sig>[a-zA-Z0-9$]+)\(',
            r'yt\.akamaized\.net/\)\s*\|\|\s*.*?\s*[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*(?:encodeURIComponent\s*\()?\s*(?P<sig>[a-zA-Z0-9$]+)\(',
            r'\b[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*(?P<sig>[a-zA-Z0-9$]+)\(',
            r'\b[a-zA-Z0-9]+\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*(?P<sig>[a-zA-Z0-9$]+)\(',
            r'\bc\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*\([^)]*\)\s*\(\s*(?P<sig>[a-zA-Z0-9$]+)\('
        ],
        'Initial JS player signature function name'
    )
    
    jsi = JSInterpreter(jscode).interpret_statement
    initial_function = jsi.extract_function(funcname, jscode)
    
    print(initial_function(["AAJfrJfQdSswRAIgdO73xmbds0ATY1soCSp1-ZOt0gYmrwvyqQ3RQlxXlX8CICh2qjcGf2YRWDeLuPoQGdQV0G-RzaOvfoIRUXsuChVu"]))

else:
    print(f"Erro ao acessar a URL: {response.status_code}")