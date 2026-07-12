import os

path = os.environ.get("PATH", "")
paths = path.split(os.pathsep)
paths = [p for p in paths if "iverilog" not in p.lower()]
os.environ["PATH"] = os.pathsep.join(paths)

try:
    import weasyprint
    print("Successfully imported weasyprint!")
except Exception as e:
    print("Failed to import weasyprint:", type(e).__name__, e)
