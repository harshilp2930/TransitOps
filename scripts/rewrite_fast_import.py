#!/usr/bin/env python3
import re
import sys

mapping = {
    'hivashah29@example.com': ('hivashah29', 'hivashah2021@gmail.com'),
    'dhiraj217@example.com': ('DHIRAJ RAJAI', 'dhirajrajai12@gmail.com'),
    'dhiraj217@github.com': ('DHIRAJ RAJAI', 'dhirajrajai12@gmail.com'),
    'harshilp2930@example.com': ('Harshil Patel', '12302130501073@gcet.ac.in'),
    'harshilp2930@github.com': ('Harshil Patel', '12302130501073@gcet.ac.in'),
    'yashpatel826-hub@users.noreply.github.com': ('Yash Ka.Patel', '12302130501064@gcet.ac.in'),
    '12302130501064@gcet.ac.in': ('Yash Ka.Patel', '12302130501064@gcet.ac.in'),
}

author_re = re.compile(r'^(author|committer) (.+?) <(.+?)> (\d+) ([+-]\d+)$')

def transform_line(line: str) -> str:
    m = author_re.match(line.rstrip('\n'))
    if not m:
        return line
    role, name, email, ts, tz = m.groups()
    if email in mapping:
        new_name, new_email = mapping[email]
        return f"{role} {new_name} <{new_email}> {ts} {tz}\n"
    return line

def main():
    inp = sys.stdin
    out = sys.stdout
    for line in inp:
        out.write(transform_line(line))

if __name__ == '__main__':
    main()
