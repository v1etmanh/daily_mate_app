"""
test_client.py — Test tất cả endpoints của Demo Server

Chạy:
    python test_client.py
    python test_client.py --scenario hypertension
    python test_client.py --scenario market_basket
    python test_client.py --scenario cold_weather
"""
import json, sys, urllib.request, urllib.error

BASE = "http://localhost:5001"

def post(path, body):
    data = json.dumps(body).encode()
    req  = urllib.request.Request(
        BASE + path, data=data,
        headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode()}
    except Exception as e:
        return {"error": str(e)}

def get(path):
    try:
        with urllib.request.urlopen(BASE + path, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

def print_result(res, top=5):
    if "error" in res:
        print(f"  ❌ ERROR: {res['error']}")
        return
    print(f"  ✅ elapsed: {res.get('elapsed_s','?')}s")
    print(f"  📍 Location: {res.get('location',{}).get('province','?')} "
          f"({res.get('location',{}).get('food_region','?')})")
    d = res.get("demand_snapshot", {})
    print(f"  🌡 Demand — hydration:{d.get('hydration_need'):.2f}  "
          f"warming:{d.get('warming_food_need'):.2f}  "
          f"cooling:{d.get('cooling_food_need'):.2f}")
    print(f"  🍽  Pool size: {res.get('dish_pool_size','?')} dishes")
    print(f"\n  TOP {top} GỢI Ý:")
    for dish in res.get("ranked_dishes", [])[:top]:
        print(f"    {dish['rank']}. [{dish['final_score']:.4f}] {dish['title']}"
              f" | boost={dish['ingredient_boost']:.2f}"
              f" | {dish.get('cook_time_min','?')} phút")
        for line in dish.get("explanation", []):
            if line: print(f"       → {line}")
    fb = res.get("fallback_ids", [])
    if fb:
        print(f"\n  💡 Fallback: {len(fb)} món dự phòng")

