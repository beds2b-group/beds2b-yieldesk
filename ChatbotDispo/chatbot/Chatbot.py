import os
import json
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from .prompts import INSTRUCTION_GENERATE_JSON, INSTRUCTION_GENERATE_JSON_2, PROMPT_GENERATE_JSON, CLIENT_RESPONSE
from services.ServiceDispo import ServiceDispo

load_dotenv()

class Chatbot:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.environ.get("OPENAI_API_KEY"),
        )

        self.serviceDispo = ServiceDispo()

    def getResponseByDispo(self, json_dispo, user_question):
        response = self.client.responses.create(
            model=os.environ.get("MODEL"),
            input=str(json_dispo),
            instructions=CLIENT_RESPONSE
        )

        return response.output_text

    def generateJSONClean(self, ticket):
        BASE_DIR = Path(__file__).resolve().parent.parent

        with open(BASE_DIR / "data" / "Hotels.toon", "r", encoding="utf-8") as f:
            hotel_catalog_str = f.read()

        resp = self.client.responses.create(
            model=os.environ.get("MODEL"),
            instructions=(PROMPT_GENERATE_JSON + f"{hotel_catalog_str}"),
            input=ticket,
            tools=INSTRUCTION_GENERATE_JSON_2,
            tool_choice={"type": "function", "name": "get_dispo"},
            parallel_tool_calls=False
        )

        tool_call = next(
            (item for item in resp.output if item.type == "function_call"),
            None
        )

        dispo_args = json.loads(tool_call.arguments)

        ##2 ADULTS BY DEFAULT
        dispo_args["adultnum"] = 2 if dispo_args["adultnum"] == None else dispo_args["adultnum"]

        if not dispo_args["is_dispo"]:
            print('No se ha podido hacer la consulta de disponibilidad')
            return dispo_args

        return self.serviceDispo.getDispo(dispo_args["hotelcod"],dispo_args["datefrom"],dispo_args["dateto"], dispo_args["adultnum"] )
