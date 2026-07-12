#!/usr/bin/env python3
import re
import sys

mapping = {
    b'hivashah29@example.com': (b'hivashah29', b'hivashah2021@gmail.com'),
    b'dhiraj217@example.com': (b'DHIRAJ RAJAI', b'dhirajrajai12@gmail.com'),
    b'dhiraj217@github.com': (b'DHIRAJ RAJAI', b'dhirajrajai12@gmail.com'),
    b'harshilp2930@example.com': (b'Harshil Patel', b'12302130501073@gcet.ac.in'),
    b'harshilp2930@github.com': (b'Harshil Patel', b'12302130501073@gcet.ac.in'),
    b'yashpatel826-hub@users.noreply.github.com': (b'Yash Ka.Patel', b'12302130501064@gcet.ac.in'),
    b'12302130501064@gcet.ac.in': (b'Yash Ka.Patel', b'12302130501064@gcet.ac.in'),
}

author_re = re.compile(rb'^(author|committer) (.+?) <(.+?)> (\d+) ([+-]\d+)$', re.M)

def replace(match: re.Match) -> bytes:
    role = match.group(1)
    name = match.group(2)
    email = match.group(3)
    ts = match.group(4)
    tz = match.group(5)
    if email in mapping:
        new_name, new_email = mapping[email]
        return b'%s %s <%s> %s %s' % (role, new_name, new_email, ts, tz)
    return match.group(0)

def main(in_path: str, out_path: str):
    with open(in_path, 'rb') as f:
        data = f.read()
    new = author_re.sub(replace, data)
    with open(out_path, 'wb') as f:
        f.write(new)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: rewrite_fast_import_file.py input.dat output.dat', file=sys.stderr)
        sys.exit(2)
    main(sys.argv[1], sys.argv[2])
