import json
from pathlib import Path

KEYS_TO_REMOVE = ['RateKey', 'PaymentMethod', 'CancellationPolicies', 'Price', 'TotalPriceModifier', 'IsOnRequest', 'AdditionalInfo']

def load_json(filepath):
    BASE_DIR = Path(__file__).resolve().parent.parent
    
    with open(BASE_DIR / "data" / filepath, "r", encoding="utf-8") as f:
        return json.load(f)
    

def JSONReducer(BBDDResponse):
    rooms_json = load_json("Rooms.json")
    meals_json = load_json("Meals.json")
    hotels_json = load_json("Hotels.json")
    dispo_json = json.loads(BBDDResponse.text)

    
    for hotel in dispo_json.get('HotelAvailabilities'):
        hotel["HotelCode"] = getHotelsText(hotels_json, hotel.get('HotelCode'))
        for room in hotel.get('RoomAvailabilities'):
            room["RoomCode"] = getRoomText(rooms_json, room.get('RoomCode'))

            for rate in room.get('Rates'):
                for meal in rate.get('Meals'):
                    clean_meal(meal, meals_json)

    return dispo_json


def getRoomText(rooms, code):
    for item in rooms:
        if item.get("MTHAB") == code:
            return item.get("MTTEX1")
    return None

def getHotelsText(hotels, code):
    for item in hotels:
        r = item.get("idHotel").strip()
        if r == code:
            return item.get("nombre")
    return None

def getMealText(meals, code):
    for item in meals:
        r = item.get("MRHAB").strip()
        if r == code:
            return item.get("MRTEXT")
    return None

def clean_meal(meal, meals_json):
    meal["Code"] = getMealText(meals_json, meal.get("Code"))
    for item in KEYS_TO_REMOVE:
        meal.pop(item, None)
    return None