# Guía de pruebas Postman — LCC `citys-stats`

## 0. Para qué sirve este documento

Este documento no sustituye a la defensa completa del proyecto. Sirve solo para estudiar y defender las dos colecciones JSON de Postman que has pegado:

* **PRUEBAS 1**: colección larga de validación CRUD, filtros, errores y limpieza.
* **PRUEBAS 2**: colección más centrada en búsqueda libre, ordenación, paginación combinada y validación de parámetros.

La idea es que puedas explicar en un examen:

1. Qué hace cada petición.
2. Por qué espera ese código HTTP.
3. Qué comprueba cada `pm.test`.
4. Cómo crear una petición distinta si te la piden en directo.
5. Cómo razonar una colección Postman desde cero.

---

# 1. Idea base de la API que se está probando

El recurso se llama:

```text
citys-stats
```

Cada registro representa una ciudad y tiene esta estructura:

```json
{
  "city": "madrid",
  "country": "spain",
  "un_2025_population": 7000000
}
```

La clave lógica del recurso es:

```text
city + country
```

Eso significa que una ciudad concreta se identifica con una URL como:

```http
GET {{baseUrl}}/madrid/spain
```

La variable de Postman `{{baseUrl}}` representa la URL base de la API. En local normalmente sería algo parecido a:

```text
http://localhost:10000/api/v2/citys-stats
```

---

# 2. Cómo leer una petición de Postman

Cada bloque del JSON de Postman tiene esta estructura:

```json
{
  "name": "Nombre de la prueba",
  "request": {
    "method": "GET",
    "url": {
      "raw": "{{baseUrl}}?country=china"
    }
  },
  "event": [
    {
      "listen": "test",
      "script": {
        "exec": [
          "pm.test('...', function () {",
          "    pm.expect(pm.response.code).to.eql(200);",
          "});"
        ]
      }
    }
  ]
}
```

## Partes importantes

| Parte                 | Qué significa                                            |
| --------------------- | -------------------------------------------------------- |
| `name`                | Nombre visible de la prueba en Postman.                  |
| `request.method`      | Método HTTP: `GET`, `POST`, `PUT`, `DELETE`.             |
| `request.url.raw`     | URL completa que se va a llamar.                         |
| `request.header`      | Cabeceras, por ejemplo `Content-Type: application/json`. |
| `request.body.raw`    | JSON enviado en `POST` o `PUT`.                          |
| `event.listen = test` | Script que se ejecuta después de recibir la respuesta.   |
| `pm.response.code`    | Código HTTP recibido.                                    |
| `pm.response.json()`  | Body de respuesta convertido a objeto JavaScript.        |
| `pm.expect(...)`      | Aserción: comprueba que algo sea verdad.                 |

---

# 3. Códigos HTTP que aparecen en estas pruebas

| Código | Significado                      | Cuándo se usa aquí                                        |
| ------ | -------------------------------- | --------------------------------------------------------- |
| `200`  | Operación correcta con respuesta | `GET` correcto, `PUT` correcto.                           |
| `201`  | Recurso creado o datos cargados  | `POST` correcto, `loadInitialData`.                       |
| `204`  | Operación correcta sin body      | `DELETE` correcto.                                        |
| `400`  | Petición mal formada             | Body inválido, query inválida, URL/body no coinciden.     |
| `404`  | Recurso no encontrado            | Intentar actualizar o borrar algo inexistente.            |
| `405`  | Método no permitido              | Usar `PUT` donde no toca o `POST` sobre recurso concreto. |
| `409`  | Conflicto                        | Crear un recurso duplicado.                               |

Frase para examen:

> Los códigos no son aleatorios. Cada código explica el resultado de la operación: éxito con datos, éxito sin datos, creación, error del cliente, recurso inexistente, método no permitido o conflicto con datos existentes.

---

# 4. Orden de ejecución: por qué las pruebas están numeradas

Estas colecciones son **stateful**, es decir, una prueba puede depender del resultado de las anteriores.

Por ejemplo:

1. Primero se borra la colección.
2. Luego se comprueba que está vacía.
3. Después se cargan datos iniciales.
4. Luego se filtra, se crea, se actualiza y se borra.
5. Al final se limpia y se restaura.

Si ejecutas una prueba suelta, puede fallar porque no está preparado el estado previo.

Frase para examen:

> Las pruebas están ordenadas para controlar el estado de la base de datos. Empiezo limpiando, cargo datos conocidos, ejecuto operaciones sobre esos datos y termino restaurando una colección estable.

---

# 5. PRUEBAS 1 — explicación petición por petición

## 01. `DELETE {{baseUrl}}` — reset inicial

```http
DELETE {{baseUrl}}
```

Espera:

```http
204 No Content
```

Qué valida:

* Que se puede borrar la colección completa.
* Que la API responde correctamente sin body.
* Que el estado inicial queda limpio para las siguientes pruebas.

Cómo defenderlo:

> Empiezo con un `DELETE` de colección para que las pruebas sean reproducibles. Si quedan datos de una ejecución anterior, los tests podrían dar falsos fallos.

---

## 02. `GET {{baseUrl}}` — colección vacía

```http
GET {{baseUrl}}
```

Espera:

```http
200 OK
[]
```

Qué valida:

* Que consultar una colección vacía no es error.
* Que la respuesta es un array.
* Que el array tiene longitud `0`.

Test clave:

```js
pm.expect(Array.isArray(data)).to.eql(true);
pm.expect(data.length).to.eql(0);
```

Cómo defenderlo:

> Una colección vacía debe devolver `200` y un array vacío. No debe devolver `404`, porque la colección existe aunque no tenga elementos.

---

## 03. `GET {{baseUrl}}/loadInitialData` — carga inicial

```http
GET {{baseUrl}}/loadInitialData
```

Espera:

```http
201 Created
```

Qué valida:

* Que se cargan datos iniciales.
* Que la respuesta es un array.
* Que hay al menos 10 elementos.

Cómo defenderlo:

> Esta prueba prepara un dataset conocido. Las pruebas posteriores dependen de que existan ciudades como `shanghai`, `tokyo`, `china`, `india`, etc.

---

## 04. `GET {{baseUrl}}` — colección después de cargar

```http
GET {{baseUrl}}
```

Espera:

```http
200 OK
```

Qué valida:

* Que después de `loadInitialData` la colección ya no está vacía.
* Que devuelve un array.
* Que hay al menos 10 elementos.

Cómo defenderlo:

> Esta prueba confirma que la carga inicial no solo ha respondido bien, sino que realmente ha dejado datos consultables.

---

## 05. `GET {{baseUrl}}?country=china` — filtro por país

```http
GET {{baseUrl}}?country=china
```

Espera:

```http
200 OK
```

Qué valida:

* Que el filtro `country` funciona.
* Que hay resultados para `china`.
* Que todos los elementos devueltos tienen `country = china`.

Test clave:

```js
data.forEach(function (d) {
    pm.expect(d.country).to.eql('china');
});
```

Cómo defenderlo:

> El parámetro `country` llega por query string. La API debe filtrar la colección y devolver solo los registros cuyo país coincide exactamente con `china`.

---

## 06. `GET {{baseUrl}}?city=tokyo` — filtro por ciudad

```http
GET {{baseUrl}}?city=tokyo
```

Espera:

```http
200 OK
```

Qué valida:

* Que el filtro `city` funciona.
* Que existe `tokyo`.
* Que todos los resultados tienen `city = tokyo`.

Cómo defenderlo:

> Es igual que el filtro por país, pero usando el campo `city`. Como es una búsqueda exacta, todos los resultados deben tener exactamente esa ciudad.

---

## 07. `GET {{baseUrl}}?un_2025_population=33412512` — filtro numérico

```http
GET {{baseUrl}}?un_2025_population=33412512
```

Espera:

```http
200 OK
```

Qué valida:

* Que se puede filtrar por población.
* Que el valor se compara como número.
* Que todos los resultados tienen `un_2025_population = 33412512`.

Cómo defenderlo:

> Los parámetros de query llegan como texto, así que la API debe convertir `33412512` a número antes de compararlo con el campo numérico del recurso.

---

## 08. `GET {{baseUrl}}?offset=1&limit=2` — paginación

```http
GET {{baseUrl}}?offset=1&limit=2
```

Espera:

```http
200 OK
```

Qué valida:

* Que `offset` y `limit` funcionan.
* Que la respuesta es un array.
* Que devuelve exactamente 2 elementos.

Concepto:

```js
result.slice(offset, offset + limit)
```

Cómo defenderlo:

> `offset` indica cuántos elementos salto y `limit` cuántos devuelvo. Con `offset=1&limit=2`, salto el primero y devuelvo los dos siguientes.

---

## 09. `GET {{baseUrl}}/shanghai/china` — recurso concreto

```http
GET {{baseUrl}}/shanghai/china
```

Espera:

```http
200 OK
```

Qué valida:

* Que se puede consultar un recurso concreto.
* Que devuelve un objeto, no un array.
* Que el objeto tiene `city = shanghai` y `country = china`.

Cómo defenderlo:

> Cuando consulto `/shanghai/china`, ya no estoy filtrando una colección, sino pidiendo un recurso concreto identificado por `city + country`. Por eso debe devolver un objeto.

---

## 10. `POST {{baseUrl}}` con body inválido

```http
POST {{baseUrl}}
Content-Type: application/json
```

Body:

```json
{
  "city": "madrid",
  "country": "spain"
}
```

Espera:

```http
400 Bad Request
```

Qué valida:

* Que no se puede crear un recurso incompleto.
* Que falta `un_2025_population`.
* Que el backend valida el body.

Cómo defenderlo:

> El body está mal formado porque falta un campo obligatorio. Por eso no es `409` ni `404`; es `400`, un error de petición del cliente.

---

## 11. `POST {{baseUrl}}` con body válido

```http
POST {{baseUrl}}
Content-Type: application/json
```

Body:

```json
{
  "city": "madrid",
  "country": "spain",
  "un_2025_population": 7000000
}
```

Espera:

```http
201 Created
```

Qué valida:

* Que se puede crear `madrid/spain`.
* Que devuelve los campos correctos.
* Que no devuelve `_id`.

Test importante:

```js
pm.expect(data._id).to.eql(undefined);
```

Cómo defenderlo:

> `POST` crea un recurso nuevo dentro de la colección. Si se crea correctamente, devuelve `201`. La prueba también comprueba que no se exponga `_id`, porque es un campo interno de la base de datos.

---

## 12. `POST {{baseUrl}}` duplicado

Se vuelve a enviar el mismo body de `madrid/spain`.

Espera:

```http
409 Conflict
```

Qué valida:

* Que no se permiten duplicados.
* Que la clave lógica es `city + country`.
* Que el error correcto es conflicto, no body inválido.

Cómo defenderlo:

> El JSON está bien formado, pero entra en conflicto con un recurso que ya existe. Por eso se devuelve `409 Conflict`.

---

## 13. `PUT {{baseUrl}}` — método no permitido sobre colección

```http
PUT {{baseUrl}}
```

Espera:

```http
405 Method Not Allowed
```

Qué valida:

* Que no se puede hacer `PUT` sobre toda la colección.
* Que `PUT` solo se permite sobre un recurso concreto.

Cómo defenderlo:

> Para actualizar necesito saber qué recurso actualizo. Por eso `PUT` sobre la colección completa no está permitido.

---

## 14. `POST {{baseUrl}}/madrid/spain` — método no permitido sobre recurso concreto

```http
POST {{baseUrl}}/madrid/spain
```

Espera:

```http
405 Method Not Allowed
```

Qué valida:

* Que `POST` solo crea en la colección.
* Que no se usa `POST` sobre una URL que ya identifica un recurso concreto.

Cómo defenderlo:

> `POST` se usa en `{{baseUrl}}` para crear. Si ya estoy en `/madrid/spain`, esa URL representa un recurso concreto; ahí tendría sentido `GET`, `PUT` o `DELETE`, no `POST`.

---

## 15. `PUT {{baseUrl}}/madrid/spain` con URL y body distintos

```http
PUT {{baseUrl}}/madrid/spain
```

Body:

```json
{
  "city": "barcelona",
  "country": "spain",
  "un_2025_population": 7200000
}
```

Espera:

```http
400 Bad Request
```

Qué valida:

* Que la URL y el body deben hablar del mismo recurso.
* Que no se permite actualizar `madrid/spain` enviando `barcelona/spain` en el body.

Cómo defenderlo:

> La URL identifica el recurso que quiero modificar. Si el body trae otra ciudad, la petición es incoherente y se rechaza con `400`.

---

## 16. `PUT {{baseUrl}}/sevilla/spain` — recurso inexistente

```http
PUT {{baseUrl}}/sevilla/spain
```

Espera:

```http
404 Not Found
```

Qué valida:

* Que no se puede actualizar un recurso que no existe.
* Que en esta API `PUT` no crea si no existe.

Cómo defenderlo:

> En este contrato, `PUT` sirve para actualizar, no para hacer upsert. Si `sevilla/spain` no existe, devuelve `404`.

---

## 17. `PUT {{baseUrl}}/madrid/spain` válido

```http
PUT {{baseUrl}}/madrid/spain
```

Body:

```json
{
  "city": "madrid",
  "country": "spain",
  "un_2025_population": 7100000
}
```

Espera:

```http
200 OK
```

Qué valida:

* Que se puede actualizar un recurso existente.
* Que la población cambia a `7100000`.
* Que devuelve el recurso actualizado.

Cómo defenderlo:

> El recurso existe, el body es válido y la URL coincide con el body. Por eso se actualiza y devuelve `200` con el objeto actualizado.

---

## 18. `GET {{baseUrl}}/madrid/spain` — comprobar actualización

```http
GET {{baseUrl}}/madrid/spain
```

Espera:

```http
200 OK
```

Qué valida:

* Que el cambio del `PUT` se ha guardado realmente.
* Que la población sigue siendo `7100000`.

Cómo defenderlo:

> Esta prueba comprueba persistencia. No basta con que el `PUT` devuelva bien; hay que verificar con un `GET` posterior que el dato quedó guardado.

---

## 19. `DELETE {{baseUrl}}/madrid/spain` — borrar recurso concreto

```http
DELETE {{baseUrl}}/madrid/spain
```

Espera:

```http
204 No Content
```

Qué valida:

* Que se puede borrar un recurso concreto.
* Que el borrado correcto no devuelve body.

Cómo defenderlo:

> `DELETE` elimina el recurso identificado por la URL. Si todo va bien, devuelve `204` porque no necesita devolver contenido.

---

## 20. `DELETE {{baseUrl}}/madrid/spain` otra vez

```http
DELETE {{baseUrl}}/madrid/spain
```

Espera:

```http
404 Not Found
```

Qué valida:

* Que el recurso ya no existe después del primer borrado.
* Que intentar borrarlo de nuevo devuelve `404`.

Cómo defenderlo:

> La primera vez se borra. La segunda vez ya no está, así que la API debe responder que no lo encuentra.

---

## 21. `GET {{baseUrl}}?city=madrid&country=spain` — comprobar borrado por filtro

```http
GET {{baseUrl}}?city=madrid&country=spain
```

Espera:

```http
200 OK
[]
```

Qué valida:

* Que `madrid/spain` ya no aparece ni siquiera filtrando.
* Que una búsqueda sin resultados devuelve array vacío, no error.

Cómo defenderlo:

> Aunque no haya resultados, el filtro se ha ejecutado correctamente. Por eso devuelve `200` con array vacío.

---

## 22. `DELETE {{baseUrl}}` — limpieza final

```http
DELETE {{baseUrl}}
```

Espera:

```http
204 No Content
```

Qué valida:

* Que se limpia todo al final.
* Que la colección no queda contaminada por pruebas anteriores.

Cómo defenderlo:

> Limpio al final para que la ejecución de tests deje el sistema en un estado controlado.

---

## 23. `GET {{baseUrl}}/loadInitialData` — restauración final

```http
GET {{baseUrl}}/loadInitialData
```

Espera:

```http
201 Created
```

Qué valida:

* Que se restauran datos iniciales.
* Que la colección queda estable con al menos 10 elementos.

Cómo defenderlo:

> Después de limpiar, restauro datos para que la API no quede vacía tras ejecutar la colección.

---

# 6. PRUEBAS 2 — explicación petición por petición

PRUEBAS 2 es más corta y se centra en funcionalidades avanzadas de consulta.

---

## 01. `DELETE {{baseUrl}}` — limpieza inicial

```http
DELETE {{baseUrl}}
```

Espera:

```http
204 No Content
```

Defensa:

> Igual que en PRUEBAS 1, se limpia la colección para empezar desde un estado conocido.

---

## 02. `GET {{baseUrl}}/loadInitialData` — carga inicial

```http
GET {{baseUrl}}/loadInitialData
```

Espera:

```http
201 Created
```

Defensa:

> Carga los datos base necesarios para poder probar búsqueda, ordenación, filtros y paginación.

---

## 03. `GET {{baseUrl}}?q=seo` — búsqueda libre

```http
GET {{baseUrl}}?q=seo
```

Espera:

```json
[
  {
    "city": "seoul",
    "country": "south-korea"
  }
]
```

Qué valida:

* Que `q` hace búsqueda parcial.
* Que `seo` encuentra `seoul`.
* Que devuelve exactamente un resultado.

Diferencia clave:

| Filtro exacto                            | Búsqueda libre                         |
| ---------------------------------------- | -------------------------------------- |
| `?city=seoul` exige coincidencia exacta. | `?q=seo` permite coincidencia parcial. |

Cómo defenderlo:

> `q` no es un filtro exacto, es una búsqueda libre. Por eso `seo` encuentra `seoul`, aunque no sea el nombre completo.

---

## 04. `GET {{baseUrl}}?sort=-un_2025_population&limit=1` — ordenar descendente

```http
GET {{baseUrl}}?sort=-un_2025_population&limit=1
```

Espera:

```json
[
  {
    "city": "jakarta"
  }
]
```

Qué valida:

* Que `sort=-un_2025_population` ordena por población descendente.
* Que `limit=1` devuelve solo el primer resultado.
* Que la ciudad con más población esperada es `jakarta`.

Cómo defenderlo:

> El signo `-` delante del campo indica orden descendente. Primero se ordena por población de mayor a menor y después `limit=1` deja solo el primer elemento.

---

## 05. `GET {{baseUrl}}?country=india&sort=city&offset=1&limit=1` — filtros combinados

```http
GET {{baseUrl}}?country=india&sort=city&offset=1&limit=1
```

Espera:

```json
[
  {
    "city": "kolkata",
    "country": "india"
  }
]
```

Qué valida:

* Que se puede combinar filtro, ordenación y paginación.
* Que primero se filtra por `country=india`.
* Después se ordena por `city`.
* Después se aplica `offset=1`.
* Finalmente se aplica `limit=1`.

Orden lógico:

```text
1. Filtrar
2. Ordenar
3. Paginar
```

Cómo defenderlo:

> Esta prueba demuestra que los parámetros de query son acumulables. No se usa solo uno; la API debe combinarlos correctamente.

---

## 06. `GET {{baseUrl}}?sort=unknown` — sort inválido

```http
GET {{baseUrl}}?sort=unknown
```

Espera:

```http
400 Bad Request
```

Qué valida:

* Que no se puede ordenar por un campo inexistente.
* Que la API valida `sort` contra una lista de campos permitidos.

Campos válidos:

```text
city
country
un_2025_population
```

También pueden existir en descendente:

```text
-city
-country
-un_2025_population
```

Cómo defenderlo:

> `unknown` no es un campo del recurso. Si la API aceptara cualquier sort, podría ordenar mal o comportarse de forma impredecible. Por eso devuelve `400`.

---

## 07. `GET {{baseUrl}}?offset=-1` — offset inválido

```http
GET {{baseUrl}}?offset=-1
```

Espera:

```http
400 Bad Request
```

Qué valida:

* Que `offset` no puede ser negativo.
* Que la paginación se valida.

Cómo defenderlo:

> `offset` significa cuántos elementos salto. No tiene sentido saltar `-1` elementos, así que la petición es inválida.

---

## 08. `GET {{baseUrl}}?limit=-3` — limit inválido

```http
GET {{baseUrl}}?limit=-3
```

Espera:

```http
400 Bad Request
```

Qué valida:

* Que `limit` no puede ser negativo.
* Que no se puede pedir una cantidad negativa de resultados.

Cómo defenderlo:

> `limit` indica cuántos elementos quiero devolver. Un valor negativo no tiene sentido, así que se responde con `400`.

---

## 09. `POST {{baseUrl}}` — crear `valencia/spain`

```http
POST {{baseUrl}}
```

Body:

```json
{
  "city": "valencia",
  "country": "spain",
  "un_2025_population": 850000
}
```

Espera:

```http
201 Created
```

Qué valida:

* Que se puede crear un recurso nuevo.
* Que la respuesta contiene `valencia`, `spain` y `850000`.

Defensa:

> Es el `POST` válido de PRUEBAS 2. Crea un recurso que luego se actualiza, consulta y borra.

---

## 10. `PUT {{baseUrl}}/valencia/spain` — actualizar población

```http
PUT {{baseUrl}}/valencia/spain
```

Body:

```json
{
  "city": "valencia",
  "country": "spain",
  "un_2025_population": 900000
}
```

Espera:

```http
200 OK
```

Qué valida:

* Que el recurso creado se puede actualizar.
* Que la población cambia de `850000` a `900000`.

Defensa:

> La URL y el body coinciden en `valencia/spain`, el recurso existe y el body es válido. Por eso el `PUT` devuelve `200`.

---

## 11. `GET {{baseUrl}}/valencia/spain` — comprobar actualización

```http
GET {{baseUrl}}/valencia/spain
```

Espera:

```http
200 OK
```

Qué valida:

* Que `valencia/spain` sigue existiendo.
* Que la población guardada es `900000`.

Defensa:

> Igual que en PRUEBAS 1, se comprueba persistencia con un `GET` después del `PUT`.

---

## 12. `DELETE {{baseUrl}}/valencia/spain` — borrar recurso

```http
DELETE {{baseUrl}}/valencia/spain
```

Espera:

```http
204 No Content
```

Qué valida:

* Que se puede borrar el recurso creado durante la prueba.

Defensa:

> Esta petición cierra el ciclo CRUD de `valencia/spain`: crear, actualizar, consultar y borrar.

---

## 13. `DELETE {{baseUrl}}` — limpieza final

```http
DELETE {{baseUrl}}
```

Espera:

```http
204 No Content
```

Defensa:

> Limpia la colección para no dejar restos de las pruebas.

---

## 14. `GET {{baseUrl}}/loadInitialData` — restauración final

```http
GET {{baseUrl}}/loadInitialData
```

Espera:

```http
201 Created
```

Defensa:

> Restaura el dataset inicial para que el sistema quede en un estado estable.

---

# 7. Diferencia rápida entre PRUEBAS 1 y PRUEBAS 2

| Tema                          | PRUEBAS 1      | PRUEBAS 2        |
| ----------------------------- | -------------- | ---------------- |
| Limpieza inicial              | Sí             | Sí               |
| Carga inicial                 | Sí             | Sí               |
| Comprobar colección vacía     | Sí             | No               |
| Filtros exactos               | Sí             | Sí, combinado    |
| Filtro numérico               | Sí             | No               |
| Paginación básica             | Sí             | Sí, combinada    |
| Búsqueda libre `q`            | No             | Sí               |
| Ordenación `sort`             | No             | Sí               |
| Sort inválido                 | No             | Sí               |
| Offset/limit inválidos        | No             | Sí               |
| POST inválido                 | Sí             | No               |
| POST duplicado                | Sí             | No               |
| PUT inválidos                 | Sí             | No               |
| Ciclo CRUD válido             | `madrid/spain` | `valencia/spain` |
| Limpieza y restauración final | Sí             | Sí               |

Frase para examen:

> PRUEBAS 1 valida el contrato REST completo y muchos errores. PRUEBAS 2 valida sobre todo consultas avanzadas: búsqueda libre, ordenación, paginación combinada y parámetros inválidos.

---

# 8. Cómo construir una petición nueva si te lo piden en examen

Sigue siempre este método.

## Paso 1. Decidir qué quieres probar

Ejemplos:

```text
Quiero probar que se crea una ciudad.
Quiero probar que un recurso inexistente devuelve 404.
Quiero probar que un filtro sin resultados devuelve array vacío.
Quiero probar que un sort inválido devuelve 400.
```

## Paso 2. Elegir método HTTP

| Quiero probar...           | Método                              |
| -------------------------- | ----------------------------------- |
| Consultar colección        | `GET {{baseUrl}}`                   |
| Consultar recurso concreto | `GET {{baseUrl}}/:city/:country`    |
| Crear                      | `POST {{baseUrl}}`                  |
| Actualizar                 | `PUT {{baseUrl}}/:city/:country`    |
| Borrar colección           | `DELETE {{baseUrl}}`                |
| Borrar recurso concreto    | `DELETE {{baseUrl}}/:city/:country` |

## Paso 3. Elegir URL

| Caso                   | URL                                                    |
| ---------------------- | ------------------------------------------------------ |
| Colección completa     | `{{baseUrl}}`                                          |
| Carga inicial          | `{{baseUrl}}/loadInitialData`                          |
| Recurso concreto       | `{{baseUrl}}/tokyo/japan`                              |
| Filtro por ciudad      | `{{baseUrl}}?city=tokyo`                               |
| Filtro por país        | `{{baseUrl}}?country=china`                            |
| Filtro numérico        | `{{baseUrl}}?un_2025_population=33412512`              |
| Búsqueda libre         | `{{baseUrl}}?q=seo`                                    |
| Ordenación             | `{{baseUrl}}?sort=city`                                |
| Ordenación descendente | `{{baseUrl}}?sort=-un_2025_population`                 |
| Paginación             | `{{baseUrl}}?offset=0&limit=5`                         |
| Combinada              | `{{baseUrl}}?country=india&sort=city&offset=1&limit=1` |

## Paso 4. Decidir código esperado

| Situación                     | Código esperado |
| ----------------------------- | --------------- |
| `GET` correcto                | `200`           |
| `POST` correcto               | `201`           |
| `PUT` correcto                | `200`           |
| `DELETE` correcto             | `204`           |
| Body incompleto o incoherente | `400`           |
| Query inválida                | `400`           |
| Recurso inexistente           | `404`           |
| Método no permitido           | `405`           |
| Duplicado                     | `409`           |

## Paso 5. Escribir las comprobaciones

Una prueba buena comprueba dos cosas:

1. Código HTTP.
2. Contenido de la respuesta.

Ejemplo pobre:

```js
pm.expect(pm.response.code).to.eql(200);
```

Ejemplo mejor:

```js
pm.test('Devuelve 200', function () {
    pm.expect(pm.response.code).to.eql(200);
});

var data = pm.response.json();

pm.test('Devuelve tokyo/japan', function () {
    pm.expect(Array.isArray(data)).to.eql(true);
    pm.expect(data.length).to.eql(1);
    pm.expect(data[0].city).to.eql('tokyo');
    pm.expect(data[0].country).to.eql('japan');
});
```

---

# 9. Plantillas de tests Postman

## 9.1. Comprobar código HTTP

```js
pm.test('Devuelve 200', function () {
    pm.expect(pm.response.code).to.eql(200);
});
```

---

## 9.2. Leer JSON

```js
var data = pm.response.json();
```

---

## 9.3. Comprobar que la respuesta es un array

```js
pm.test('Devuelve array', function () {
    pm.expect(Array.isArray(data)).to.eql(true);
});
```

---

## 9.4. Comprobar array vacío

```js
pm.test('Devuelve array vacío', function () {
    pm.expect(Array.isArray(data)).to.eql(true);
    pm.expect(data.length).to.eql(0);
});
```

---

## 9.5. Comprobar longitud exacta

```js
pm.test('Devuelve exactamente 2 elementos', function () {
    pm.expect(data.length).to.eql(2);
});
```

---

## 9.6. Comprobar mínimo de elementos

```js
pm.test('Hay al menos 10 elementos', function () {
    pm.expect(data.length).to.be.at.least(10);
});
```

---

## 9.7. Comprobar campos de un objeto

```js
pm.test('El recurso tiene los campos correctos', function () {
    pm.expect(data.city).to.eql('madrid');
    pm.expect(data.country).to.eql('spain');
    pm.expect(data.un_2025_population).to.eql(7000000);
});
```

---

## 9.8. Comprobar todos los elementos de un array

```js
pm.test('Todos los elementos son de china', function () {
    data.forEach(function (d) {
        pm.expect(d.country).to.eql('china');
    });
});
```

---

## 9.9. Comprobar que no se expone `_id`

```js
pm.test('No devuelve _id', function () {
    pm.expect(data._id).to.eql(undefined);
});
```

---

## 9.10. Comprobar error esperado sin leer body

```js
pm.test('Devuelve 400', function () {
    pm.expect(pm.response.code).to.eql(400);
});
```

---

# 10. Ejemplos de pruebas nuevas que podrías crear

## Ejemplo 1. Buscar una ciudad inexistente

```http
GET {{baseUrl}}?city=atlantis
```

Código esperado:

```http
200 OK
```

Test:

```js
pm.test('Filtro sin resultados devuelve 200', function () {
    pm.expect(pm.response.code).to.eql(200);
});

var data = pm.response.json();

pm.test('Devuelve array vacío', function () {
    pm.expect(Array.isArray(data)).to.eql(true);
    pm.expect(data.length).to.eql(0);
});
```

Defensa:

> No es `404` porque no estoy pidiendo un recurso concreto. Estoy filtrando una colección. El filtro es válido, simplemente no encuentra resultados.

---

## Ejemplo 2. Recurso concreto inexistente

```http
GET {{baseUrl}}/atlantis/ocean
```

Código esperado:

```http
404 Not Found
```

Test:

```js
pm.test('GET recurso inexistente devuelve 404', function () {
    pm.expect(pm.response.code).to.eql(404);
});
```

Defensa:

> Aquí sí es `404` porque la URL pide un recurso concreto que no existe.

---

## Ejemplo 3. Crear con población como string

```http
POST {{baseUrl}}
Content-Type: application/json
```

Body:

```json
{
  "city": "granada",
  "country": "spain",
  "un_2025_population": "300000"
}
```

Código esperado si la validación exige número real:

```http
400 Bad Request
```

Test:

```js
pm.test('POST con población como string devuelve 400', function () {
    pm.expect(pm.response.code).to.eql(400);
});
```

Defensa:

> El campo `un_2025_population` debe ser numérico. Si llega como texto y el contrato es estricto, se rechaza con `400`.

---

## Ejemplo 4. Orden ascendente por ciudad con límite

```http
GET {{baseUrl}}?sort=city&limit=1
```

Test genérico:

```js
pm.test('Orden por ciudad devuelve 200', function () {
    pm.expect(pm.response.code).to.eql(200);
});

var data = pm.response.json();

pm.test('Devuelve un único resultado', function () {
    pm.expect(Array.isArray(data)).to.eql(true);
    pm.expect(data.length).to.eql(1);
});
```

Defensa:

> La prueba valida que `sort=city` se acepta y que `limit=1` reduce la respuesta a un único elemento. Si conozco el dataset, también puedo comprobar exactamente cuál debe ser la primera ciudad.

---

# 11. Cómo explicar `pm.test` y `pm.expect` en examen

Puedes decir:

> En Postman, cada petición puede tener tests que se ejecutan después de recibir la respuesta. Uso `pm.test` para nombrar una comprobación y `pm.expect` para verificar una condición. Si la condición no se cumple, la prueba falla.

Ejemplo:

```js
pm.test('GET devuelve 200', function () {
    pm.expect(pm.response.code).to.eql(200);
});
```

Explicación línea por línea:

| Línea                        | Explicación                                      |
| ---------------------------- | ------------------------------------------------ |
| `pm.test(...)`               | Crea una prueba con nombre.                      |
| `function () { ... }`        | Código que se ejecuta para validar la respuesta. |
| `pm.response.code`           | Código HTTP recibido.                            |
| `pm.expect(...).to.eql(200)` | Comprueba que el código sea exactamente `200`.   |

---

# 12. Respuesta maestra para defender estas colecciones

Puedes memorizar esta explicación:

> Estas colecciones de Postman validan el contrato REST de mi recurso `citys-stats`. El recurso representa ciudades con país y población estimada para 2025. La clave lógica es `city + country`, por eso un recurso concreto se accede con rutas como `/madrid/spain`.
>
> Las pruebas están ordenadas porque dependen del estado de la colección. Primero limpio datos con `DELETE`, luego cargo datos iniciales con `loadInitialData`, después hago consultas, filtros, creación, actualización y borrado, y al final vuelvo a limpiar y restaurar.
>
> En PRUEBAS 1 se valida el CRUD completo y los errores principales: body inválido, duplicado, método no permitido, mismatch entre URL y body, recurso inexistente y borrado. En PRUEBAS 2 se validan consultas más avanzadas: búsqueda libre con `q`, ordenación con `sort`, paginación con `offset` y `limit`, combinación de parámetros y errores de query.
>
> Cada test comprueba primero el código HTTP esperado y, cuando hay body, también comprueba el contenido: si es array, si tiene la longitud esperada, si los campos coinciden y si todos los elementos cumplen el filtro. Así no solo pruebo que la API responde, sino que responde correctamente.

---

# 13. Preguntas típicas y respuestas cortas

## ¿Por qué se usa `DELETE` al principio?

Para limpiar la colección y evitar que datos de ejecuciones anteriores afecten a los tests.

## ¿Por qué `GET` de colección vacía devuelve `200` y no `404`?

Porque la colección existe. Simplemente no tiene elementos, así que devuelve `[]`.

## ¿Por qué `POST` válido devuelve `201`?

Porque se ha creado un recurso nuevo.

## ¿Por qué `DELETE` correcto devuelve `204`?

Porque la operación se ha realizado correctamente y no hace falta devolver body.

## ¿Por qué el duplicado devuelve `409`?

Porque el JSON es válido, pero entra en conflicto con un recurso que ya existe.

## ¿Por qué un body incompleto devuelve `400`?

Porque el cliente ha enviado una petición mal formada.

## ¿Por qué `PUT {{baseUrl}}` devuelve `405`?

Porque `PUT` está permitido sobre recursos concretos, no sobre toda la colección.

## ¿Por qué `POST /madrid/spain` devuelve `405`?

Porque `POST` crea dentro de la colección. Una URL como `/madrid/spain` ya representa un recurso concreto.

## ¿Por qué `GET /shanghai/china` devuelve objeto y no array?

Porque consulta un recurso concreto.

## ¿Por qué `GET ?city=madrid&country=spain` devuelve array?

Porque es un filtro sobre la colección. Los filtros devuelven listas, aunque tengan cero o un resultado.

## ¿Por qué `q=seo` encuentra `seoul`?

Porque `q` hace búsqueda parcial, no coincidencia exacta.

## ¿Por qué `sort=-un_2025_population` es descendente?

Porque el signo `-` delante del campo indica orden de mayor a menor.

## ¿Por qué `offset=-1` y `limit=-3` devuelven `400`?

Porque la paginación no acepta valores negativos.

---

# 14. Errores frecuentes al crear una prueba nueva

## Error 1. Esperar `404` en un filtro sin resultados

Mal razonamiento:

```http
GET {{baseUrl}}?city=noexiste
```

Esperar:

```http
404
```

Corrección:

```http
200 OK
[]
```

Motivo:

> Es una consulta válida sobre la colección. No encontrar resultados no significa que la ruta no exista.

---

## Error 2. Leer JSON en una respuesta `204`

En un `DELETE` correcto:

```http
204 No Content
```

No deberías hacer:

```js
var data = pm.response.json();
```

Porque no hay body.

Correcto:

```js
pm.test('DELETE devuelve 204', function () {
    pm.expect(pm.response.code).to.eql(204);
});
```

---

## Error 3. Olvidar `Content-Type: application/json`

En `POST` y `PUT`, debes enviar:

```http
Content-Type: application/json
```

Si no, el backend puede no interpretar correctamente el body.

---

## Error 4. Hacer `PUT` con URL y body distintos

Incorrecto:

```http
PUT {{baseUrl}}/madrid/spain
```

Body:

```json
{
  "city": "barcelona",
  "country": "spain",
  "un_2025_population": 7200000
}
```

Resultado esperado:

```http
400 Bad Request
```

Motivo:

> La URL dice que actualizas Madrid, pero el body dice Barcelona.

---

## Error 5. Crear dos veces el mismo recurso esperando `201`

La primera vez:

```http
201 Created
```

La segunda vez:

```http
409 Conflict
```

Motivo:

> Ya existe un recurso con la misma clave `city + country`.

---

# 15. Checklist para crear una colección Postman buena

Antes de dar por buena una colección, revisa:

* [ ] Tiene una limpieza inicial.
* [ ] Carga datos iniciales conocidos.
* [ ] Comprueba al menos un `GET` de colección.
* [ ] Comprueba al menos un `GET` de recurso concreto.
* [ ] Comprueba filtros exactos.
* [ ] Comprueba búsqueda libre si existe `q`.
* [ ] Comprueba ordenación si existe `sort`.
* [ ] Comprueba paginación si existen `offset` y `limit`.
* [ ] Comprueba `POST` válido.
* [ ] Comprueba `POST` inválido.
* [ ] Comprueba duplicados con `409`.
* [ ] Comprueba `PUT` válido.
* [ ] Comprueba algún `PUT` inválido.
* [ ] Comprueba `DELETE` válido.
* [ ] Comprueba que el borrado tiene efecto real.
* [ ] No intenta leer JSON en respuestas `204`.
* [ ] Usa `Content-Type: application/json` en `POST` y `PUT`.
* [ ] Termina limpiando o restaurando los datos.

---

# 16. Mini chuleta final

```text
GET colección correcta              -> 200 + array
GET colección vacía                 -> 200 + []
GET recurso concreto existente      -> 200 + objeto
GET recurso concreto inexistente    -> 404
POST válido                         -> 201
POST body inválido                  -> 400
POST duplicado                      -> 409
POST sobre recurso concreto         -> 405
PUT colección                       -> 405
PUT recurso válido                  -> 200
PUT URL/body distinto               -> 400
PUT recurso inexistente             -> 404
DELETE colección                    -> 204
DELETE recurso existente            -> 204
DELETE recurso inexistente          -> 404
Filtro sin resultados               -> 200 + []
Sort inválido                       -> 400
Offset/limit negativo               -> 400
```

Frase final para cerrar la defensa:

> Una buena prueba de API no se limita a comprobar que responde. Comprueba que responde con el código correcto, con el tipo de dato correcto y con el contenido esperado según el contrato REST.
