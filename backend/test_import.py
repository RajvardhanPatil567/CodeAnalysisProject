import sys
print("Python path:")
for p in sys.path:
    print(f"  {p}")

try:
    from analyzer.enhanced_control_flow import analyze_control_flow
    print("\nImport successful!")
    print(f"analyze_control_flow: {analyze_control_flow.__module__}.{analyze_control_flow.__name__}")
except ImportError as e:
    print(f"\nImport failed: {e}")
    print("\nCurrent directory files:")
    import os
    for f in os.listdir('.'):
        print(f"  {f}")
    print("\nAnalyzer directory files:")
    if os.path.exists('analyzer'):
        for f in os.listdir('analyzer'):
            print(f"  {f}")
