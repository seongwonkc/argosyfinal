#!/usr/bin/env python3
import sys, pathlib, re

md = pathlib.Path(sys.argv[1])
image = sys.argv[2]
credit = sys.argv[3]

text = md.read_text(encoding="utf-8").splitlines()
out, inside, done = [], False, False
for line in text:
    if line.strip() == "---":
        inside = not inside
        out.append(line)
        continue
    if inside and line.startswith("image:"):
        # skip existing image line
        continue
    if inside and not done and re.match(r"^title:", line):
        out.append(line)
        out.append(f"image: {image}")
        out.append(f"imageCredit: {credit}")
        done = True
        continue
    out.append(line)
md.write_text("\n".join(out) + "\n", encoding="utf-8")
