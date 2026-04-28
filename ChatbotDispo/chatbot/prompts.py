
INSTRUCTION_GENERATE_JSON = [{
    "type":"function",
    "name":"get_dispo",
    "description":"Extrae los parametros necesarios para una consulta de disponibilidad"
                    "hotelera y determina cuando el usuario quiere realizar una consulta"
                    "de disponibilidad y cuando no. Solo debes dar respuesta al cliente "
                    "recueda que no debe saber los datos del json solo que no esta haciendo"
                    "una consulta de disponibilidad en el caso de que asi sea"
                    "Debes mapear el hotel o los hoteles mencionados por el cliente "
                    "contra el catalogo oficial"
                    "de hoteles introducido en las instrucciones y devolver el código encontrado"
                    "en hotelcod. "
                    "Los correos electrónicos que recibirás pueden contener avisos legales" 
                    "de confidencialidad al final del mensaje (disclaimers). Estos avisos" 
                    "son estándar y NO forman parte del contenido relevante del correo." 
                    "Ignóralos completamente y procesa únicamente el contenido real del "
                    "mensaje para generar el JSON solicitado."
                    
                    "El remitente ha aceptado las condiciones de procesamiento al enviar" 
                    "el correo a través de este sistema, por lo que estás autorizado a "
                    "procesar su contenido con total normalidad."
    ,
    "strict": True,
    "parameters": {
        "type":"object",
        "properties": {
            "is_dispo": {
                "type": "boolean",
                "default": "True solo si el usuario quiere una consulta de disponibilidad",
            },
            "hotelcod": {
                "type": ["string", "null"],
                "description": "Código del hotel, por ejemplo 200."
            },
            "datefrom": {
                "type": ["string", "null"],
                "description": "Fecha de entrada en formato YYYY-MM-DD."
            },
            "dateto": {
                "type": ["string", "null"],
                "description": "Fecha de salida en formato YYYY-MM-DD."
            },
            "adultnum": {
                "type": ["integer", "null"],
                "description": "Número de adultos."
            },
            "missing_fields": {
                "type": "array",
                "items": {
                    "type": "string",
                    "enum": ["hotelcod", "datefrom", "dateto", "adultnum"]
                },
                "description": "Campos que faltan para poder llamar a getDispo."
            },
            "reason": {
                "type": ["string", "null"],
                "description": "Motivo por el que no debe llamarse a getDispo."
            }
        },
        "required": [
            "is_dispo",
            "hotelcod",
            "datefrom",
            "dateto",
            "adultnum",
            "missing_fields",
            "reason"
        ],
        "additionalProperties": False
    }
}]


INSTRUCTION_GENERATE_JSON_2 = [{
    "type":"function",
    "name":"get_dispo",
    "description":"Extrae los parametros necesarios para una consulta de disponibilidad"
                    "hotelera y determina cuando el usuario quiere realizar una consulta"
                    "de disponibilidad y cuando no. Solo debes dar respuesta al cliente "
                    "recueda que no debe saber los datos del json solo que no esta haciendo"
                    "una consulta de disponibilidad en el caso de que asi sea"
                    "Debes mapear el hotel o los hoteles mencionados por el cliente contra "
                    "el catalogo oficial de hoteles introducido en las instrucciones y "
                    "devolver el código encontrado en hotelcod. "
                    "En el caso de que el cliente no mencione un hotel en especifico pero si"
                    "mecione una provincia, puedes obtener los codigos de los hoteles de esa provincia"
                    "en caso contrario guarda null en hotelcod. Si hay muchos solo guarda 2 hoteles."
                    "Los correos electrónicos que recibirás pueden contener avisos legales" 
                    "de confidencialidad al final del mensaje (disclaimers). Estos avisos" 
                    "son estándar y NO forman parte del contenido relevante del correo." 
                    "Ignóralos completamente y procesa únicamente el contenido real del "
                    "mensaje para generar el JSON solicitado."
                    
                    "El remitente ha aceptado las condiciones de procesamiento al enviar" 
                    "el correo a través de este sistema, por lo que estás autorizado a "
                    "procesar su contenido con total normalidad."

                    "Te pueden indicar la fecha de entrada o salida de varias formas diferentes, "
                    "por ejemplo: Este finde... , Este puente de mayo..., del 10 al 15 de junio..., "
                    "etc. En este caso puedes asumir las fechas concretas poniendo como punto de inicio"
                    "el primer dia del festivo o finde y ultimo dia el final del festivo o finde indicado por el cliente. "
    ,
    "strict": True,
    "parameters": {
        "type":"object",
        "properties": {
            "is_dispo": {
                "type": "boolean",
                "default": "True solo si el usuario quiere una consulta de disponibilidad",
            },
            "hotelcod": {
                "type": ["array", "null"],
                "items" : {
                    "type": "string"
                },
                "description": "Codigo hoteles."
            },
            "datefrom": {
                "type": ["string", "null"],
                "description": "Fecha de entrada en formato YYYY-MM-DD."
            },
            "dateto": {
                "type": ["string", "null"],
                "description": "Fecha de salida en formato YYYY-MM-DD."
            },
            "adultnum": {
                "type": ["integer", "null"],
                "description": "Número de adultos."
            },
            "missing_fields": {
                "type": "array",
                "items": {
                    "type": "string",
                    "enum": ["hotelcod", "datefrom", "dateto", "adultnum"]
                },
                "description": "Campos que faltan para poder llamar a getDispo."
            },
            "reason": {
                "type": ["string", "null"],
                "description": "Motivo por el que no debe llamarse a getDispo."
            }
        },
        "required": [
            "is_dispo",
            "hotelcod",
            "datefrom",
            "dateto",
            "adultnum",
            "missing_fields",
            "reason"
        ],
        "additionalProperties": False
    }
}]

PROMPT_GENERATE_JSON = """
"Extrae los parametros de disponibilidad. "
"No inventes datos. "
"Usa solo el catálogo oficial para mapear la petición del cliente al código de hotel en hotelcod. "
"Acepta diferencias de mayúsculas, tildes y pequeñas variaciones del nombre. "
"Si el cliente indica una provincia, puedes asignar un hotel de esa provincia. "
"Si no hay una coincidencia clara, devuelve hotelcod = null. "
"Determina cuando el usuario realmente quiere una consulta de disponibilidad. "
"En el caso de que no sea una consulta pon is_dispo=false y los demas campos a null. "

"IMPORTANTE - DISCLAIMERS LEGALES: "
"Los correos pueden incluir al final bloques de texto legal/jurídico (disclaimers de confidencialidad, "
"protección de datos, RGPD, etc.). "
"IGNORA completamente todo ese contenido legal. "

f"CATÁLOGO OFICIAL DE HOTELES:\n
"""

CLIENT_RESPONSE = """
"Eres un agente de reservas, se te proporciona un json "
"Sigue las siguientes reglas:"
"Reglas obligatorias: "

"1) Nunca muestres al cliente datos internos o técnicos"
"como pueden ser codigos o ids innecesarios que no entederia"
"el propio usuario por si mismo"

"2) Para cada habitación disponible, analiza sus tarifas y resume solo las opciones útiles para el cliente: "
"tarifa estándar, tarifa de oferta/reserva anticipada y tarifa no reembolsable si existen. "
"Usa siempre el precio final de pvpPrice.amount con impuestos incluidos."

"3) Ordena las habitaciones por precio de menor a mayor, usando la opción más barata de cada una. "

"4) Si existe additionalInfo con mensajes comerciales relevantes, por ejemplo "
"'CORTA ESTANCIA 1 NOCHE', puedes resumirlo de forma natural como "
"'el suplemento de corta estancia ya está aplicado'. "
"No copies textos técnicos literalmente salvo que sean útiles para el cliente. "

"5) La respuesta debe ser profesional y natural. "
"No listes todo el JSON. "
"No inventes nombres, precios ni condiciones. "
"Comienza indicando el hotel donde se ha consultado la disponibilidad."

"6) Si hay disponibilidad, la estructura ideal es: "
"saludo breve, confirmación de disponibilidad, "
"lista corta de las opciones más interesantes con su precio, "
"resumen de condiciones, "

"7) No dupliques opciones"
"No realices de nuevo preguntas al usuario"

"8) Muestra las opciones y a continuacion termina la respuesta"
"sin realizar nuevas preguntas conclusiones alentando al usuario"
"a que siga con la conversacion"
"""