# Payku Docs — Documentación completa

# Payku API — 🇨🇱 Chile (ES)

> Documentación oficial de la API de Payku para Chile, generada automáticamente desde la especificación OpenAPI (v2.1.01). Fuente: https://docs.payku.com/ · Sandbox: https://des.payku.cl/

URL base: `https://app.payku.cl/` (Default server) · `https://des.payku.cl/` (Sandbox server)

## Introducción

Bienvenido a la API de payku. Puedes usar nuestra API para acceder a los distintos
endpoints de payku, donde podrás generar y gestionar pagos mediante distintos
métodos y obtener información de ellos.

El API está organizado alrededor de REST. Posee URLs predecibles y
orientadas a recursos, y utiliza códigos de respuesta HTTP para indicar el
resultado de la llamada. Todas las respuestas de la API retornan objetos
JSON, incluyendo los errores.

El solicitante debe buscar un código de resultado 200. Si se recibe
cualquier código de resultado distinto de 200, la solicitud o la respuesta
no es válida, lo que significa que los campos no pasaron los controles de
validación de parte de payku. Utilizamos características incluidas en el
protocolo HTTP, como autenticación, los cuales son soportados por la gran
mayoría de los clientes HTTP.

**Importante — ¿Cómo saber si una operación falló?**

No te fíes solo del código HTTP (por ejemplo, 200). En nuestra API, muchas
respuestas con error también llegan con código HTTP 200. Esto es intencional y
forma parte del diseño de la API.

Siempre revisa el contenido JSON de la respuesta y busca el campo `status`:
- Si `status` es `"success"`, la operación se realizó correctamente.
- Si `status` es `"failed"`, hubo un error (por ejemplo, datos inválidos o una
  operación rechazada). Revisa también el mensaje de error que venga en la
  misma respuesta.

## Autenticación

payku utiliza Token Based Authentication sobre HTTPS para la autenticación. Para tener acceso a nuestra API, accede a tu cuenta en la sección de Integración encontrarás la opción de Tokens integración y API. Los request no autenticados o incorrectos retornarán una respuesta de token Invalido.

## API Seguridad

Cada solicitud es requerido tener incluido en el header:
  - Authorization: Bearer **TOKEN-PÚBLICO**

## Firma

En el caso del API de suscripciones, anulación y mall se agregó una capa más de seguridad a través de una firma que se envía en el header del request, para obtener dicha firma es necesario lo siguiente:

Se debe concatenar en formato para url el Request Path junto a todos los parámetros del request, los cuales deben ser ordenados alfabéticamente por key, tal que key=value. Por lo tanto, si el valor de email cliente es “example@domain.com” el formato correcto sería “example%40domain.com” y luego concatenados con el carácter ‘&’.

Una vez que los sets de caracteres son ordenados y concatenados, el hash es calculado usando la función HMAC con cifrado tipo sha256, y el token privado.

**Nota:** Si un elemento de la data, tiene como valor un objeto o arreglo, se excluye de la data. Esta función esta en el ejemplo de PHP y de Javascript.

### Ejemplo PHP
Endpoint de la API:
```php
$request_path = urlencode('/api/suclient');
```
Ordenando los parámetros:
```php
$data = [
  'email' => 'johndoe@example.com',
  'name' => 'John Doe',
  'phone' => '923122312',
  'address' => 'Moneda 101',
  'country' => 'Chile',
  'region' => 'Metropolitana',
  'city' => 'Santiago',
  'postal_code' => '850000',
  'additional_parameters' => [
    'parameter_1' => 'example',
    'parameter_2' => 'example 2',
  ]
];
ksort($data);
```
Transformación de los parámetros a formato url:
```php
    $contador = 0;
    $concatenar = null;

    if (!empty($data) && !is_null($data)) {
        foreach ($data as $key => $val) {
            if(gettype($val)!='array' && gettype($val)!='object'){
                if ($contador>0) {
                    $concatenar .= '&';
                }
                $concatenar .= $key . '=' . urlencode($val);
                $contador++;
            }
        }
    };
```
Concatenación de los parámetros en formato url con el endpoint de la API:
```php
$concat = $request_path.'&'.$concatenar;
```
Firma:
```php
$sign = hash_hmac('sha256', $concat, 'fe551abcef62fcf002dc598922e68f0a');
```

### Ejemplo JavaScript
Importar dependencia CryptoJS:
```javascript
const CryptoJS = require("crypto-js");
```
Endpoint de la API:
```javascript
const requestPath = encodeURIComponent('/api/suclient');
```
Ordenando los parámetros:
```javascript
const data = {
  email: "johndoe@example.com",
  name: "John Doe",
  phone: "923122312",
  address: "Moneda 101",
  country: "Chile",
  region: "Metropolitana",
  city: "Santiago",
  postal_code: "850000"
};
const orderedData = {};
Object.keys(data).sort().forEach(function(key) {
  orderedData[key] = data[key];
  if (typeof orderedData[key] === 'object') {
        delete orderedData[key];
  }
});
```
Transformación de los parámetros a formato url:
```javascript
const arrayConcat = new URLSearchParams(orderedData).toString();
```
Concatenación de los parámetros en formato url con el endpoint de la API:
```javascript
const concat = requestPath + "&" + arrayConcat;
```
Firma:
```javascript
const sign = CryptoJS.HmacSHA256(concat, "fe551abcef62fcf002dc598922e68f0a").toString();
```

El resultado de la firma obtenida para ambos ejemplos es:

```javascript
"c9c86202b1246f6ebeb080d08b3b99a22d36d0e8cffb7fd4e65af0fea4dd12bb"
```

## Errores

payku usa respuestas HTTP convencionales para indicar el éxito o fracaso de un request.
En general, códigos en el rango de los 2xx indican éxito, códigos en el rango 4xx indican
un error que falló debido a la información proporcionada (ej: un parámetro requerido fue
omitido, un pago falló, etc.), y códigos en el rango de los 5xx indican un error con
los servidores de payku (estos son raros).

## Códigos de error
<div class="errorContent">
<table>
  <tbody>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">400</strong>
        <p class="psmall">Bad Request</p>
      </td>
      <td class="errorDescription">Hay un problema con tu request</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">401</strong>
        <p class="psmall">Unauthorized</p>
      </td>
      <td class="errorDescription">Tu token es incorrecto o error de firma</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">403</strong>
        <p class="psmall">Forbidden</p>
      </td>
      <td class="errorDescription">No tienes permiso para ver esta página</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">404</strong>
        <p class="psmall">Not Found</p>
      </td>
      <td class="errorDescription">El recurso especificado no fue encontrado </td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">405</strong>
        <p class="psmall">Method Not Allowed</p>
      </td>
      <td class="errorDescription">Trataste de ingresar a un recurso con un método inválido</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">406</strong>
        <p class="psmall">Not Acceptable</p>
      </td>
      <td class="errorDescription">Solicitaste un formato que no es json</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">410</strong>
        <p class="psmall">Gone</p>
      </td>
      <td class="errorDescription">El recurso solicitado fue removido de nuestros servidores</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">422</strong>
        <p class="psmall">Unprocessable Entity</p>
      </td>
      <td class="errorDescription">No podemos procesar tu solicitud, revísala.</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">429</strong>
        <p class="psmall">Too Many Requests</p>
      </td>
      <td class="errorDescription">¡Estás solicitando muchos recursos! ¡Detente!</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">500</strong>
        <p class="psmall">Internal Server Error</p>
      </td>
      <td class="errorDescription">Tuvimos un problema con nuestro servidor. Inténtalo nuevamente más tarde.</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">503</strong>
        <p class="psmall">Service Unavailable</p>
      </td>
      <td class="errorDescription">Estamos offline por mantenimiento. Inténtalo nuevamente más tarde</td>
    </tr>
  </tbody>
</table>
</div>

## Acceso a la API

Si tienes una cuenta en payku, puedes acceder a la API REST mediante los siguientes endpoints:

<div class="content">
  <table class="center smallTable">
    <thead>
      <tr>
        <th style="text-align:center;"><strong>Site</strong></th>
        <th style="text-align:center;"><strong>BASE URL FOR REST ENDPOINT</strong></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Production</strong></td>
        <td align="center"><a target="_blank" href="https://app.payku.cl/api">https://app.payku.cl/api</a></td>
      </tr>
      <tr>
        <td><strong>Sandbox</strong></td>
        <td><a target="_blank" href="https://des.payku.cl/api">https://des.payku.cl/api</a></td>
      </tr>
    </tbody>
  </table>
</div>

- **Producción**: proporciona acceso directo para generar transacciones reales.
- **Sandbox**: permite probar su integración sin afectar los datos reales.

Para realizar pruebas a nuestra API de forma rapida puede utilizar la colección y el ambiente de Postman
de esta documentación: <a target="_blank" href="https://docs.payku.com/postman/payku-cl-es.postman_collection.json">Colección Postman</a>
y <a target="_blank" href="https://docs.payku.com/postman/payku-environment.postman_environment.json">Entorno Postman</a>.
Incluyen todos los endpoints con cuerpos de ejemplo y calculan la firma <strong>Sign</strong> automáticamente.

## Tarjetas de prueba

Para realizar pruebas de transacciones utilice estas tarjetas:

<div class="content">
  <table class="center">
    <thead>
      <tr>
        <th style="text-align:center; width:25%"><strong>Tipo de tarjeta</strong></th>
        <th style="text-align:center; width:37.5%"><strong>Detalle</strong></th>
        <th style="text-align:center; width:37.5%"><strong>Resultado</strong></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>VISA</td>
        <td align="center">4051 8856 0044 6623 CVV 123 cualquier fecha de expiración</td>
        <td align="center">Genera transacciones aprobadas.</td>
      </tr>
      <tr>
        <td>AMEX</td>
        <td align="center">3700 0000 0002 032 CVV 1234 cualquier fecha de expiración</td>
        <td align="center">Genera transacciones aprobadas.</td>
      </tr>
      <tr>
        <td>MASTERCARD</td>
        <td align="center">5186 0595 5959 0568 CVV 123 cualquier fecha de expiración</td>
        <td align="center">Genera transacciones rechazadas.</td>
      </tr>
      <tr>
        <td>Redcompra</td>
        <td>4051 8842 3993 7763</td>
        <td align="center">Genera transacciones aprobadas (para operaciones que permiten débito Redcompra y prepago)</td>
      </tr>
      <tr>
        <td>Redcompra</td>
        <td>5186 0085 4123 3829</td>
        <td align="center">Genera transacciones rechazadas (para operaciones que permiten débito Redcompra y prepago)</td>
      </tr>
      <tr>
        <td>Prepago VISA</td>
        <td>4051 8860 0005 6590 CVV 123 cualquier fecha de expiración</td>
        <td align="center">Genera transacciones aprobadas.</td>
      </tr>
      <tr>
        <td>Prepago MASTERCARD</td>
        <td>5186 1741 1062 9480 CVV 123 cualquier fecha de expiración</td>
        <td align="center">Genera transacciones rechazadas.</td>
      </tr>
    </tbody>
  </table>
</div>

Cuando aparece el formulario de autenticación con RUT y clave, se debe usar el RUT 11.111.111-1 y la clave 123.

## Transacción

Permite la creación de transacciones y posteriormente consultar su estado.
<br>
<div class='container'>
  <img src='https://docs.payku.com/img/diagrams/Diagrama-Transaccion.png' alt='Avatar' class='image' style='width:100%'>
  <div class='middle'>
    <a target='_blank' href='https://docs.payku.com/img/diagrams/Diagrama-Transaccion.png' class='text'>Ver diagrama</a>
  </div>
</div>

### Crear transacción

`POST /api/transaction`

Este método permite crear una orden de pago a **payku** y recibe como respuesta la **URL** para redirigir el browser del pagador y el **token** que identifica la transacción.
Una vez que el pagador efectúe el pago exitoso, **payku** notificará el resultado a la página del comercio que se envió en el parámetro **urlnotify**.

**additional_parameters** = permite enviar información adicional para ser registrada en payku asociada a la transacción **order_ext** dentro de additional_parameters, es una palabra reservada, y es útil para asociar la transacción a un identificador único del comercio

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | string |  | Email del usuario — máximo 100 caracteres — Ejemplo: `johndoe@example.com` |
| `order` | string |  | Orden del comercio — máximo 40 caracteres — Ejemplo: `98745` |
| `subject` | string |  | Descripción de la orden — máximo 2000 caracteres — Ejemplo: `payment description` |
| `amount` | integer |  | Monto de la orden — máximo 14 dígitos — Ejemplo: `25000` |
| `currency` | string |  | Moneda. — máximo 6 caracteres — Ejemplo: `CLP` |
| `payment` | integer |  | Identificador del medio de pago. Si se envía el identificador, el pagador será redireccionado directamente al medio de pago que se indique. - 99 Todos - 1 Webpay - 4 Etpay (Transferencia) - 6 Pago46 - 9 Mach - 19 Fintoc (Transferencia) - 23 Tenpo - 26 Floid (Transferencia) - 100 Webpay plus (1 a 3 cuotas) - 101 Webpay plus (4 a 6 cuotas) - 102 Webpay plus (7 a 12 cuotas) — máximo 2 caracteres — Ejemplo: `1` |
| `expired` | string |  | Fecha en la cual expira la transacción **Este campo no es requerido.** Formato permitido (Año-mes-día hora:minuto:segundo) Ejemplo: 2023-10-18 23:59:59 En caso de ser enviado, debe cumplir con las siguiente reglas: - Debe ser mayor a 5 minutos de la fecha actual (hora Santiago). - Se requiere urlreturn, se adjuntará como parámetros GET /?message_error=expired&id=trx60dc327d9e4c094 — Ejemplo: `2023-10-19 13:05:10` |
| `urlreturn` | string |  | url de retorno del comercio donde payku redirigirá al pagador luego de 3 segundos de obtener el resultado de la transacción. — máximo 200 caracteres — Ejemplo: `https://youwebsite.com/urlreturn?orderClient=98745` |
| `urlnotify` | string |  | url callback del comercio donde payku notificara el pago. - Nota: Luego de que el cliente finalice el proceso de pago en su entidad bancaria payku respondera de forma automática al endpoint ingresado en urlnotify el resultado de la operación bancaria. - **Ejemplo Aprobado:** - { - "transaction_id": "9916587765599311", - "payment_key" : "trx32cb779c0a777fc68", - "transaction_key" : "9916581777599311", - "verification_key": "8b3e2202fb086a7de93777ae34d5e18c", - "order": "199", - "status": "success" - } - **Ejemplo Rechazado:** - { - "transaction_id": "9916587765599311", - "payment_key" : "trx32cb779c0a777fc68", - "transaction_key" : "9916581777599311", - "verification_key": "8b3e2202fb086a7de93777ae34d5e18c", - "order": "199", - "status": "failed" - } — máximo 600 caracteres — Ejemplo: `https://www.youwebsite.com/urlnotify?orderClient=98745` |
| `additional_parameters` | object |  | Parámetros adicionales del cliente. Es obligatorio para los proveedores 26 (Floid), 19 (Fintoc) y 4 (Etpay), y opcional para el resto de medios de pago. — máximo 4000 caracteres |
| ↳ `parameters1` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `keyValue` |
| ↳ `parameters2` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `keyValue` |
| ↳ `order_ext` | string |  | Identificador único proporcionado por el comercio, que permita a asociar la transacción a un identificador externo — Ejemplo: `fff-777` |
| ↳ `payer_rut` | string |  | RUT para especificar un único pagador. Se puede usar cuando el parámetro **payment** sea 26 (Floid), 19 (Fintoc) o 4 (Etpay), y es un campo obligatorio para estos proveedores. — Ejemplo: `111111111` |
| ↳ `payer_bank` | string |  | Código para preseleccionar el banco. Este parametro es opcional y solo funcionará cuando el parametro payment sea (Fintoc / Etpay / Floid). Los valores a utilizar los puedes obtener en el endpoint api/banks?currency=clp (Opcional) — Ejemplo: `0001` |

**cURL**

```bash
curl -X POST \
https://BASE-URL/api/transaction \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
-d '{
  "email": "johndoe@example.com",
  "order": "5696",
  "subject": "Cliente Test",
  "amount": 25000,
  "currency": "CLP",
  "payment": 1,
  "expired": "2023-10-19 13:05:10",
  "urlreturn": "https://youwebsite.com/urlreturn?orderClient=5696",
  "urlnotify": "https://youwebsite.com/urlnotify?orderClient=5696",
  "additional_parameters": {
    "parameters1":"keyValue",
    "parameters2":"keyValue",
    "order_ext":"fff-777"
  }
}'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/transaction', [
    'json' => [
      'email' => 'johndoe@example.com',
      'order' => "98745",
      'subject' => 'Client Test',
      'amount' => 25000,
      'currency' => 'CLP',
      'payment' => 1,
      'expired' => '2023-10-19 13:05:10',
      'urlreturn' => 'https://youwebsite.com/urlreturn?orderClient=98745',
      'urlnotify' => 'https://www.youwebsite.com/urlnotify?orderClient=98745',
      'additional_parameters' => [
        'parameters1'=>'keyValue',
        'parameters2'=>'keyValue',
        'order_ext'=>'fff-777'
        ]
      ],
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  email: "johndoe@example.com",
  order: "98745",
  subject: "payment description",
  amount: 25000,
  "currency": "CLP",
  payment: 1,
  expired: "2023-10-19 13:05:10",
  urlreturn: "https://youwebsite.com/urlreturn?orderClient=98745",
  urlnotify: "https://www.youwebsite.com/urlnotify?orderClient=98745",
  additional_parameters: {
    parameters1:"keyValue",
    parameters2:"keyValue",
    order_ext:"fff-777"
  }
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "pending",
  "id": "trx3b4d77b43acd9a720",
  "url": "https://BASE_URL/url_de_pago"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de transacción. Los posibles estados que puede obtener son los siguientes: - register - pending - success - rejected — Ejemplo: `pending` |
| `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `trx3b4d77b43acd9a720` |
| `url` | string |  | URL a redireccionar al usuario. — Ejemplo: `https://BASE_URL/url_de_pago` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener múltiples transacciones

`GET /api/transaction`

Este método permite obtener la información de las transacciones realizados en payku, este método permite una paginación con un máximo de 4000 registros por página, además, posee los siguientes filtros:
  - date_init: indica la fecha desde donde se desea comenzar la búsqueda de transacciones, si este parámetro no es enviado la busqueda iniciara la fecha actual .
  - date_end: indica la fecha donde se desea que termine la búsqueda de transacciones, si este parámetro no es enviado la busque tendrá como fecha final la fecha actual.
  - estatus: se puede filtrar la búsqueda de las transacciones dependiendo del estatus en la que se encuentra.  por ejemplo.  /api/transaction?success=true ó para traer multiples estatus /api/transaction?pending=true&rejected=true.

para la paginación es necesario agregar al final del endpoint lo siguiente ?page=1&per_page=100 siendo el primer parámetro el número de la página y el segundo el número de registros por página. En caso de querer buscar las transacciones entre las fechas 01-09-2021 y 15-09-2021, además que solo sean las transacciones de estado success, la url a utilizar seria la siguiente:  https://[URL_BASE]/api/transaction?date_init=2021-09-01&date_end=2021-09-15&success=true.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/transaction  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/transaction', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/transaction', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "transaction": [
    {
      "id": "107999",
      "status": "success",
      "created_at": "2019-10-25 14:10:03",
      "email": "johndoe@example.com",
      "amount": 98745,
      "order": "1572023402",
      "subject": "Description",
      "payment": {
        "start": "2023-12-16 15:10:33",
        "end": "2023-12-16 15:10:36",
        "media": "Webpay",
        "transaction_id": 107999,
        "payment_key": "pra934939d607922f9e",
        "transaction_key": null,
        "deposit_date": "2023-10-05",
        "verification_key": "6669cbd982ef54c28f2f15fb9dc5262d",
        "authorization_code": "107742",
        "last_4_digits": "1233",
        "installments": 0,
        "card_type": "VN",
        "additional_parameters": {
          "identificador": "11.111.111-1",
          "banco": "Banco Estado",
          "numero_cuenta": "00126544977"
        },
        "currency": "CLP"
      },
      "nullify": {
        "status": "complete"
      },
      "gateway_response": {
        "status": "success",
        "message": "successful transaction"
      }
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `transaction` | array of objects |  |  |
| ↳ `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `107999` |
| ↳ `status` | string |  | Estatus de transacción. Los posibles estados que puede obtener son los siguientes: - register - pending - success - rejected — Ejemplo: `success` |
| ↳ `created_at` | string |  | Fecha de registro. — Ejemplo: `2019-10-25 14:10:03` |
| ↳ `email` | string |  | Email del usuario — Ejemplo: `johndoe@example.com` |
| ↳ `amount` | int |  | Monto. — Ejemplo: `98745` |
| ↳ `order` | string |  | Número de orden. — Ejemplo: `1572023402` |
| ↳ `subject` | string |  | Descripción de la orden de compra. — Ejemplo: `Description` |
| ↳ `payment` | object |  |  |
| ↳ ↳ `start` | string |  | Inicio de la transacción. — Ejemplo: `2023-12-16 15:10:33` |
| ↳ ↳ `end` | string |  | Fin de la transacción. — Ejemplo: `2023-12-16 15:10:36` |
| ↳ ↳ `media` | string |  | Medio de pago, utilizado por el usuario. — Ejemplo: `Webpay` |
| ↳ ↳ `transaction_id` | int |  | Identificador de la transacción creado por payku. — Ejemplo: `107999` |
| ↳ ↳ `payment_key` | string |  | Identificador del cobro creado por payku. — Ejemplo: `pra934939d607922f9e` |
| ↳ ↳ `transaction_key` | string |  | Identificador de la transacción creado por payku. |
| ↳ ↳ `deposit_date` | string |  | Fecha el cual se realizará el depósito al cliente. — Ejemplo: `2023-10-05` |
| ↳ ↳ `verification_key` | string |  | Código de verificación creado por payku. — Ejemplo: `6669cbd982ef54c28f2f15fb9dc5262d` |
| ↳ ↳ `authorization_code` | string |  | Código de autorización. — Ejemplo: `107742` |
| ↳ ↳ `last_4_digits` | string |  | Últimos 4 dígitos de la tarjeta afiliada. — Ejemplo: `1233` |
| ↳ ↳ `installments` | int |  | Cuotas. — Ejemplo: `0` |
| ↳ ↳ `card_type` | string |  | Tipo de tarjeta. — Ejemplo: `VN` |
| ↳ ↳ `additional_parameters` | object |  | **Ejemplo** de parámetros adicionales que puede enviar payku. |
| ↳ ↳ ↳ `identificador` | string |  | **Ejemplo** del Identificador de la transacción: — Ejemplo: `11.111.111-1` |
| ↳ ↳ ↳ `banco` | string |  | **Ejemplo** del banco el cual se realizo la transacción: — Ejemplo: `Banco Estado` |
| ↳ ↳ ↳ `numero_cuenta` | string |  | **Ejemplo** del número de cuenta el cual se realizo la transacción: — Ejemplo: `00126544977` |
| ↳ ↳ `currency` | string |  | Moneda. — Ejemplo: `CLP` |
| ↳ `nullify` | object |  | Objeto que contiene información de la respuesta de la anulación |
| ↳ ↳ `status` | string |  | Estatus de anulación. Los posibles estados que puede obtener son los siguientes: - pending - awaiting_funds - waiting_bank_details - complete - reverse_deleted - reverse_completed - reverse_deleted — Ejemplo: `complete` |
| ↳ `gateway_response` | object |  | Objeto que contiene información de la respuesta de la transacción |
| ↳ ↳ `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - rejected - refunded partial - refunded — Ejemplo: `success` |
| ↳ ↳ `message` | string |  | Mensaje que describe el estado. - successful transaction - Rechazo de transacción. - Transacción debe reintentarse. - Error en transacción. - Rechazo por error de tasa. - Excede cupo máximo mensual. - Excede límite diario por transacción. - Rubro no autorizado. — Ejemplo: `successful transaction` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

### Obtener transacción

`GET /api/transaction/{identificador}`

Este método permite obtener la información de una transacción realizado en **payku**

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | ID de la transacción a solicitar, payku puede recibir como id tanto el identificador de la transacción como el identificador de cobro: - payment_key - transaction_key — máximo 30 caracteres |

**CURL**

```text
curl -X GET \
https://BASE-URL/api/transaction/ID-IDENTIFICADOR  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/transaction/trx3b4d77b43acd9a720', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/transaction/trx3b4d77b43acd9a720', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "id": "trx3b4d77b43acd9a720",
  "created_at": "2019-10-25 14:10:03",
  "order": "1572023402",
  "email": "johndoe@example.com",
  "subject": "Description",
  "amount": "98745",
  "payment": {
    "start": "2023-12-16 15:10:33",
    "end": "2023-12-16 15:10:36",
    "media": "Webpay",
    "transaction_id": 107999,
    "payment_key": "pra934939d607922f9e",
    "transaction_key": null,
    "deposit_date": "2023-10-05",
    "verification_key": "6669cbd982ef54c28f2f15fb9dc5262d",
    "authorization_code": "107742",
    "last_4_digits": "1233",
    "installments": 0,
    "card_type": "VN",
    "additional_parameters": {
      "identificador": "11.111.111-1",
      "banco": "Banco Estado",
      "numero_cuenta": "00126544977",
      "network": {
        "ip_address": "192.0.2.123"
      }
    },
    "currency": "CLP"
  },
  "nullify": {
    "status": "complete"
  },
  "gateway_response": {
    "status": "success",
    "message": "successful transaction"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - register - pending - success - rejected — Ejemplo: `success` |
| `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `trx3b4d77b43acd9a720` |
| `created_at` | string |  | Fecha de registro. — Ejemplo: `2019-10-25 14:10:03` |
| `order` | string |  | Número de orden. — Ejemplo: `1572023402` |
| `email` | string |  | Email del usuario — Ejemplo: `johndoe@example.com` |
| `subject` | string |  | Descripción de la orden de compra. — Ejemplo: `Description` |
| `amount` | string |  | Monto. — Ejemplo: `98745` |
| `payment` | object |  |  |
| ↳ `start` | string |  | Inicio de la transacción. — Ejemplo: `2023-12-16 15:10:33` |
| ↳ `end` | string |  | Fin de la transacción. — Ejemplo: `2023-12-16 15:10:36` |
| ↳ `media` | string |  | Medio de pago, utilizado por el usuario. — Ejemplo: `Webpay` |
| ↳ `transaction_id` | int |  | Identificador de la transacción creado por payku. — Ejemplo: `107999` |
| ↳ `payment_key` | string |  | Identificador del cobro creado por payku. — Ejemplo: `pra934939d607922f9e` |
| ↳ `transaction_key` | string |  | Identificador de la transacción creado por payku. |
| ↳ `deposit_date` | string |  | Fecha el cual se realizará el depósito al cliente. — Ejemplo: `2023-10-05` |
| ↳ `verification_key` | string |  | Código de verificación creado por payku. — Ejemplo: `6669cbd982ef54c28f2f15fb9dc5262d` |
| ↳ `authorization_code` | string |  | Código de autorización. — Ejemplo: `107742` |
| ↳ `last_4_digits` | string |  | Últimos 4 dígitos de la tarjeta afiliada. — Ejemplo: `1233` |
| ↳ `installments` | int |  | Cuotas. — Ejemplo: `0` |
| ↳ `card_type` | string |  | Tipo de tarjeta. — Ejemplo: `VN` |
| ↳ `additional_parameters` | object |  | **Ejemplo** de parámetros adicionales que puede enviar payku. |
| ↳ ↳ `identificador` | string |  | **Ejemplo** del Identificador de la transacción: — Ejemplo: `11.111.111-1` |
| ↳ ↳ `banco` | string |  | **Ejemplo** del banco el cual se realizo la transacción: — Ejemplo: `Banco Estado` |
| ↳ ↳ `numero_cuenta` | string |  | **Ejemplo** del número de cuenta el cual se realizo la transacción: — Ejemplo: `00126544977` |
| ↳ ↳ `network` | object |  | Datos de la red del usuario: |
| ↳ ↳ ↳ `ip_address` | string |  | **Ejemplo** de IP Address del usuario: — Ejemplo: `192.0.2.123` |
| ↳ `currency` | string |  | Moneda. — Ejemplo: `CLP` |
| `nullify` | object |  | Objeto que contiene información de la respuesta de la anulación |
| ↳ `status` | string |  | Estatus de anulación. Los posibles estados que puede obtener son los siguientes: - pending - awaiting_funds - waiting_bank_details - complete - reverse_deleted - reverse_completed — Ejemplo: `complete` |
| `gateway_response` | object |  | Objeto que contiene información de la respuesta de la transacción |
| ↳ `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - rejected - refunded partial - refunded — Ejemplo: `success` |
| ↳ `message` | string |  | Mensaje que describe el estado. - successful transaction - Rechazo de transacción. - Transacción debe reintentarse. - Error en transacción. - Rechazo por error de tasa. - Excede cupo máximo mensual. - Excede límite diario por transacción. - Rubro no autorizado. — Ejemplo: `successful transaction` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

## Transacción Escrow

Esta funcionalidad permitirá a las cuentas escrow autorizadas por payku realizar la liquidación de transacciones.

### Autorizar liquidación

`POST /api/escrow`

Este método permite autorizar la liquidación de una o más transacciones utilizando el identificador de las mismás, para que estas puedan ser depositadas en el wallet o la cuenta bancaria del cliente.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `transactions` | array of anys |  | Arreglo que contiene el identificador de cada una de las transacciones que se desean autorizar para liquidación. — máximo 30 caracteres — Ejemplo: `["trx3b4d77b43acd9a720","trx3b4d77b43acd9a385"]` |

**cURL**

```bash
curl -X POST \
https://BASE-URL/api/escrow \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
-d '{
  "transactions": ["trx3b4d77b43acd9a720","trx3b4d77b43acd9a385"]
}'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/escrow', [
    'json' => [
      'transactions' => ['trx3b4d77b43acd9a720','trx3b4d77b43acd9a385'],
      ],
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/escrow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  transactions: ['trx3b4d77b43acd9a720','trx3b4d77b43acd9a385'],
};

request(data);
```

**Respuestas**

*200*

```json
{
  "transactions": [
    {
      "status": "liquidate",
      "transaction_id": "trx3b4d77b43acd9a720",
      "amount": 15000,
      "availability_date": "2021-07-01",
      "deposit_date": "2021-07-06"
    },
    {
      "status": "pending",
      "transaction_id": "trx3b4d77b43bdd9a540",
      "amount": 20000,
      "availability_date": "2021-07-25",
      "deposit_date": "N/D"
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `transactions` | array of objects |  | Ejemplo: `[{"status":"liquidate","transaction_id":"trx3b4d77b43acd9a720","amount":15000,"availability_date":"2021-07-01","deposit_date":"2021-07-06"},{"status":"pending","transaction_id":"trx3b4d77b43bdd9a540","amount":20000,"availability_date":"2021-07-25","deposit_date":"N/D"}]` |
| ↳ `status` | string |  | Estatus de la transacción: - not found - pending - liquidate - pending for deposit - paid |
| ↳ `transaction_id` | string |  | Identificador de la transacción creado por payku. |
| ↳ `amount` | integer |  | Monto total de la tracción. |
| ↳ `availability_date` | string |  | Fecha de disponibilidad para autorizar la liquidación. |
| ↳ `deposit_date` | string |  | Fecha de pago de la liquidación. |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

## Anulación

Permite solicitar la anulación de una transacción realizada a través de payku.

### Crear anulación.

`POST /api/nullification`

Este método permite crear una anulación de una transacción.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string |  | Identificador de la transacción la cual se desea anular. — máximo 40 caracteres — Ejemplo: `trxpr2a45s1dytg1` |
| `amount` | int |  | Monto de la transacción. — máximo 14 dígitos — Ejemplo: `25000` |
| `subject` | string |  | descripción de la solicitud de anulación. — máximo 200 caracteres — Ejemplo: `anulación transacción` |

**cURL**

```bash
curl -X POST \
https://BASE-URL/api/nullification \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Sign: f96ddc14a73a4dd6e009db2514108a3f44832795cd5ac50e6a80fd0b0ae92112' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
-d '{
  'id': 'trxpr2a45s1dytg1',
  'amount': 25000,
  'subject': 'anulación transacción'
}'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/nullification', [
    'json' => [
      'id' => 'trxpr2a45s1dytg1',
      'amount' => 25000,
      'subject' => "anulación transacción"
      ],
    'headers' => [
      'Sign' => 'f96ddc14a73a4dd6e009db2514108a3f44832795cd5ac50e6a80fd0b0ae92112',
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/nullification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'f96ddc14a73a4dd6e009db2514108a3f44832795cd5ac50e6a80fd0b0ae92112',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  'id': 'trxpr2a45s1dytg1',
  'amount': 25000,
  'subject': 'anulación transacción'
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "nullify": {
    "id": "trxpr2a45s1dytg1",
    "amount": 25000,
    "currency": "CLP",
    "type": "total",
    "status_nullify": "complete",
    "payment": {
      "gateway": "webpay",
      "payment_type": "VC"
    },
    "created_at": "2023-05-17T19:12:57.189Z",
    "updated_at": "2023-05-17T19:12:57.189Z"
  },
  "gateway_response": {
    "status": "Successfully registered request",
    "message": "The cancellation will be executed after the amount requested is deducted from your next settlement",
    "notify": "No availability in the wallet"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estado del registro. — Ejemplo: `success` |
| `nullify` | object |  |  |
| ↳ `id` | string |  | Identificador de la transacción la cual se desea anular. — Ejemplo: `trxpr2a45s1dytg1` |
| ↳ `amount` | number |  | Monto de la transacción — Ejemplo: `25000` |
| ↳ `currency` | string |  | Moneda — Ejemplo: `CLP` |
| ↳ `type` | string |  | Tipos del registro: - **total** ( Dinero disponible, anulación fue ejecutada con éxito ) - **partial** ( No se encuentra disponible el total de los fondos, se encuentra a la espera ) — Ejemplo: `total` |
| ↳ `status_nullify` | string |  | Estatus de la anulación: - **pending** ( Registrado pending old--> (register) ) - **awaiting_funds** ( En proceso (Faltan fondos) (partial) ) - **waiting_bank_details** ( Aprobado (En espera de datos bancarios cliente) Solo Débito y otros medios de pago (waiting_bank_details) ) - **complete** ( (Dinero recolectado) (complete) ) - **reverse_deleted** ( Solicitud eliminada por sistema (request_deleted) ) - **reverse_completed** ( Anulación realizada (request_made) ) - **reverse_deleted** ( Inhabilitada (request_deleted) ) — Ejemplo: `complete` |
| ↳ `payment` | object |  |  |
| ↳ ↳ `gateway` | string |  | Medio de pago — Ejemplo: `webpay` |
| ↳ ↳ `payment_type` | string |  | Tipo de pago — Ejemplo: `VC` |
| ↳ `created_at` | string |  | Fecha de creación de solicitud de anulación — Ejemplo: `2023-05-17T19:12:57.189Z` |
| ↳ `updated_at` | string |  | Fecha de actualización de solicitud de anulación — Ejemplo: `2023-05-17T19:12:57.189Z` |
| `gateway_response` | object |  | Respuesta de la solicitud de anulación |
| ↳ `status` | string |  | Estado del registro de la solicitud de anulación — Ejemplo: `Successfully registered request` |
| ↳ `message` | string |  | Mensaje del proceso de la solicitud — Ejemplo: `The cancellation will be executed after the amount requested is deducted from your next settlement` |
| ↳ `notify` | string |  | Notificación sobre el estado de la solicitud de anulación — Ejemplo: `No availability in the wallet` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener anulación.

`GET /api/nullification/{identificador}`

Este método permite obtener las solicitudes de una anulación realizada a payku mediante un identificador:

Para realizar la consulta es necesario agregar al final del endpoint lo siguiente /{identificador} como por ejemplo: **api/nullification/trxpr2a45s1dytg1**.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/nullification/{identificador}  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/nullification/{identificador}', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/nullification/{identificador}', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "nullify": {
    "id": "trxpr2a45s1dytg1",
    "amount": 25000,
    "currency": "CLP",
    "type": "total",
    "status_nullify": "complete",
    "payment": {
      "gateway": "webpay",
      "payment_type": "VC"
    },
    "created_at": "2023-05-17T19:12:57.189Z",
    "updated_at": "2023-05-17T19:12:57.189Z"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `nullify` | object |  | Datos de retorno de la creación de una solicitud de anulación |
| ↳ `id` | string |  | Identificador de la transferencia de la cual se desea solicitar anulación. — Ejemplo: `trxpr2a45s1dytg1` |
| ↳ `amount` | number |  | Monto de la transacción — Ejemplo: `25000` |
| ↳ `currency` | string |  | Moneda — Ejemplo: `CLP` |
| ↳ `type` | string |  | Tipos del registro: - total - partial — Ejemplo: `total` |
| ↳ `status_nullify` | string |  | Estatus de la anulación: - pending **( En proceso (Faltan fondos) (partial) )** - awaiting_funds **( En proceso (Faltan fondos) (partial) )** - waiting_bank_details **( Aprobado (En espera de datos bancarios cliente) Solo Débito y otros medios de pago (waiting_bank_details) )** - complete **( (Dinero recolectado) (complete) )** - reverse_deleted **( Solicitud eliminada por sistema (request_deleted) )** - **reverse_completed ( Anulación realizada (request_made) )** - reverse_deleted **( Inhabilitada (request_deleted) )** — Ejemplo: `complete` |
| ↳ `payment` | object |  |  |
| ↳ ↳ `gateway` | string |  | Medio de pago — Ejemplo: `webpay` |
| ↳ ↳ `payment_type` | string |  | Tipo de pago — Ejemplo: `VC` |
| ↳ `created_at` | string |  | Fecha de creación de solicitud de anulación — Ejemplo: `2023-05-17T19:12:57.189Z` |
| ↳ `updated_at` | string |  | Fecha de actualización de solicitud de anulación — Ejemplo: `2023-05-17T19:12:57.189Z` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

### Generar callback.

`POST callback`

Desde la aplicación de payku, puedes generar la **url** de notificación desde la sección de configuración.

<br>
<div class='container'>
  <img src='https://docs.payku.com/img/diagrams/Muestra-Url-Notificaciones.png' alt='Avatar' class='image' style='width:100%'>
  <div class='middle'>
    <a target='_blank' href='https://docs.payku.com/img/diagrams/Muestra-Url-Notificaciones.png' class='text'>Ver ejemplo</a>
  </div>
</div>

    Ejemplo de la respuesta del callback:
      {
          "id": "morexxzxxx",
          "id_transaction": "morexxzxxx",
          "ordencompra": "367734544",
          "fecha": "24-08-2023 12:29:35",
          "monto": 7000,
          "status": "complete"
      }

## Marketplace

Permite el registro de clientes, para posteriormente realizar la distribución según porcentaje asignado.
<br>
<div class='container'>
  <img src='https://docs.payku.com/img/diagrams/Diagrama-Marketplace.png' alt='Avatar' class='image' style='width:100%'>
  <div class='middle'>
    <a target='_blank' href='https://docs.payku.com/img/diagrams/Diagrama-Marketplace.png' class='text'>Ver diagrama</a>
  </div>
</div>

### Crear cliente

`POST /api/maclient`

Este método permite la inserción de datos de un cliente.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | string | ✓ | Email del cliente. — máximo 50 caracteres — Ejemplo: `johndoe@example.com` |
| `name` | string | ✓ | Nombre del cliente — máximo 150 caracteres — Ejemplo: `John Doe` |
| `phone` | string | ✓ | Teléfono del cliente. — máximo 12 caracteres — Ejemplo: `923122312` |
| `bank` | object | ✓ | máximo 58 caracteres |
| ↳ `sbif` | string | ✓ | Código del banco al que pertenece la cuenta bancaria. — máximo 5 caracteres — Ejemplo: `0001` |
| ↳ `type` | string | ✓ | Tipo de cuenta. - 1 Corriente - 2 Vista/Cuenta RUT - 3 Ahorro — máximo 1 caracter — Ejemplo: `1` |
| ↳ `num` | string | ✓ | Número de cuenta del cliente. — máximo 40 caracteres — Ejemplo: `12312313121` |
| ↳ `rut` | string | ✓ | Registro Único Tributario. — 12 caracteres requeridos — Ejemplo: `111111111` |

**CURL**

```text
curl -X POST \
https://BASE_URL/api/maclient \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "email": "johndoe@example.com",
    "name": "John Doe",
    "phone": "923122312",
    "bank": {
      "sbif": "1234",
      "type": "1",
      "num": "12312313121",
      "rut": "111111111"
    }
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/maclient', [
    'json' => [
      'email' => 'johndoe@example.com',
      'name' => 'John Doe',
      'phone' => '923122312',
      'bank' => [
        "sbif" => "0001",
        "type" => "1",
        "num" => "1231123567",
        "rut" => "111111111",
      ]
    ],
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/maclient', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  email: "johndoe@example.com",
  name: "John Doe",
  phone: "923122312",
  bank: {
    sbif: "0001",
    type: "1",
    num: "12312313121",
    rut: "111111111"
  }
};

request(data);
```

**Respuestas**

*200*

```json
{
  "id": "madb93fc00a2cf6f4449",
  "status": "register",
  "name": "John Doe",
  "phone": "923122312",
  "email": "johndoe@example.com",
  "bank": {
    "sbif": "0001",
    "rut": "111111111",
    "type": 1,
    "num": "12312313121"
  },
  "affiliations": 0,
  "created_at": "2023-09-28 20:42:59",
  "update_at": "null"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string |  | Identificador creado por payku. — Ejemplo: `madb93fc00a2cf6f4449` |
| `status` | string |  | Estatus del cliente. — Ejemplo: `register` |
| `name` | string |  | Nombre del cliente. — Ejemplo: `John Doe` |
| `phone` | string |  | Teléfono del cliente. — Ejemplo: `923122312` |
| `email` | string |  | Email del cliente. — Ejemplo: `johndoe@example.com` |
| `bank` | object |  |  |
| ↳ `sbif` | string |  | Código banco. — Ejemplo: `0001` |
| ↳ `rut` | string |  | Registro Único Tributario. — Ejemplo: `111111111` |
| ↳ `type` | int |  | Tipo de cuenta. - 1 Corriente - 2 Vista/Cuenta RUT - 3 Ahorro — Ejemplo: `1` |
| ↳ `num` | string |  | Número de cuenta del cliente. — Ejemplo: `12312313121` |
| `affiliations` | integer |  | Cantidad de afiliaciones. — Ejemplo: `0` |
| `created_at` | string |  | Fecha de registro. — Ejemplo: `2023-09-28 20:42:59` |
| `update_at` | string |  | Fecha de modificación. — Ejemplo: `null` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener cliente

`GET /api/maclient/{identificadorCliente}`

Este método permite obtener el detalle de un cliente.

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | Identificador único por payku. — máximo 20 caracteres |

**CURL**

```text
curl -X GET \
https://BASE_URL/api/maclient/id \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/maclient/madb93fc00a2cf6f4449', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/maclient/madb93fc00a2cf6f4449', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "id": "madb93fc00a2cf6f4449",
  "status": "register",
  "name": "John Doe",
  "phone": "923122312",
  "email": "johndoe@example.com",
  "bank": {
    "sbif": "0001",
    "rut": "111111111",
    "type": 1,
    "num": "12312313121"
  },
  "affiliations": 0,
  "created_at": "2023-09-28 20:42:59",
  "update_at": "null"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string |  | Identificador creado por payku. — Ejemplo: `madb93fc00a2cf6f4449` |
| `status` | string |  | Estatus del cliente. — Ejemplo: `register` |
| `name` | string |  | Nombre del cliente. — Ejemplo: `John Doe` |
| `phone` | string |  | Teléfono del cliente. — Ejemplo: `923122312` |
| `email` | string |  | Email del cliente. — Ejemplo: `johndoe@example.com` |
| `bank` | object |  |  |
| ↳ `sbif` | string |  | Código banco. — Ejemplo: `0001` |
| ↳ `rut` | string |  | Registro Único Tributario. — Ejemplo: `111111111` |
| ↳ `type` | int |  | Tipo de cuenta. - 1 Corriente - 2 Vista/Cuenta RUT - 3 Ahorro — Ejemplo: `1` |
| ↳ `num` | string |  | Número de cuenta del cliente. — Ejemplo: `12312313121` |
| `affiliations` | integer |  | Cantidad de afiliaciones. — Ejemplo: `0` |
| `created_at` | string |  | Fecha de registro. — Ejemplo: `2023-09-28 20:42:59` |
| `update_at` | string |  | Fecha de modificación. — Ejemplo: `null` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Actualizar cliente

`PUT /api/maclient/{identificadorCliente}`

Este método permite la actualización de los datos de un cliente.

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | Identificador único de marketplace. — máximo 20 caracteres |

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `name` | string |  | Nombre del cliente — máximo 50 caracteres — Ejemplo: `John Doe Doe` |
| `phone` | string |  | Teléfono del cliente — máximo 12 dígitos — Ejemplo: `923122312` |
| `bank` | object |  | Datos bancarios del cliente — máximo 58 caracteres |
| ↳ `sbif` | string |  | Código del banco al que pertenece la cuenta bancaria — máximo 5 caracteres — Ejemplo: `0001` |
| ↳ `type` | int |  | Tipo de cuenta. - 1 Corriente - 2 Vista/Cuenta RUT - 3 Ahorro — máximo 1 caracter — Ejemplo: `3` |
| ↳ `num` | string |  | Número de cuenta del cliente. — máximo 40 caracteres — Ejemplo: `9999999` |
| ↳ `rut` | string |  | Registro Único Tributario. — 12 caracteres requeridos — Ejemplo: `111111111` |

**CURL**

```text
curl -X PUT \
https://BASE_URL/api/maclient/id \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "name":"John Doe",
    "phone":"923122312",
    "bank": {
      "sbif": "0001",
      "type": "3",
      "num": "9999999",
      "rut": "261009617"
      }
    }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('PUT', 'https://BASE_URL/api/maclient/madb93fc00a2cf6f4449', [
    'json' => [
      'name' => 'John Doe',
      'phone' => '923122312',
      'bank' => [
          'num' => '9999999',
          'rut' => '261009617'
        ]
      ],
    ],
  ],
  'headers' => [
    'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
    'Authorization' => 'Bearer TOKEN_PUBLICO'
  ]
])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/maclient/madb93fc00a2cf6f4449', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
name:"John Doe",
phone:"923122312",
bank: {
  sbif: "0001",
  type: "3",
  num: "9999999",
  rut: "261009617"
  }
};

request(data);
```

**Respuestas**

*200*

```json
{
  "id": "cl0be4c8e623c167bc8b777",
  "status": "register",
  "name": "John Doe",
  "phone": "923122312",
  "email": "923122312",
  "bank": {
    "sbif": "0001",
    "type": "3",
    "num": "9999999",
    "rut": "261009617"
  },
  "affiliations": 2,
  "affiliations_details": [
    [
      {
        "id": "s6df85b41df65b21se685",
        "status": "register",
        "token": "sgh65g1ns6fg5n1sfg2sr6j5nfg65shr6gh5s4r6h5fg6",
        "name": "market1",
        "percentage_affiliation": 1,
        "percentage_client": 99
      },
      {
        "id": "s6df85b41df65b21se685",
        "status": "register",
        "token": "sgh65g1ns6fg5n1sfg2sr6j5nfg65shr6gh5s4r6h5fg6",
        "name": "market2",
        "percentage_affiliation": 1,
        "percentage_client": 99
      }
    ]
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string |  | Identificador del marketplace. — Ejemplo: `cl0be4c8e623c167bc8b777` |
| `status` | string |  | Estatus del cliente. — Ejemplo: `register` |
| `name` | string |  | Nombre del cliente. — Ejemplo: `John Doe` |
| `phone` | string |  | Teléfono del cliente. — Ejemplo: `923122312` |
| `email` | string |  | Correo del cliente. — Ejemplo: `923122312` |
| `bank` | object |  | Datos bancarios del cliente. |
| ↳ `sbif` | string |  | Código del banco al que pertenece la cuenta bancaria. — Ejemplo: `0001` |
| ↳ `type` | string |  | Tipo de cuenta del cliente. — Ejemplo: `3` |
| ↳ `num` | string |  | Cuenta bancaria del cliente. — Ejemplo: `9999999` |
| ↳ `rut` | string |  | Rut del cliente. — Ejemplo: `261009617` |
| `affiliations` | number |  | Cantidad de afiliaciones. — Ejemplo: `2` |
| `affiliations_details` | array of objects |  |  |
| ↳ `id` | string |  | Identificador de la afiliación. |
| ↳ `status` | string |  | Estatus de la afiliación: - not found - pending - liquidate - pending for deposit - paid |
| ↳ `token` | string |  | Token de la afiliación. |
| ↳ `name` | string |  | Nombre de la afiliación. |
| ↳ `percentage_affiliation` | string |  | Porcetnaje de la afiliación. |
| ↳ `percentage_client` | string |  | Porcentaje del cliente. |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Eliminar cliente

`DELETE /api/maclient/{identificadorCliente}`

Este método permite la eliminación de un cliente asociado a un ID de usuario.

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | Identificador único de cliente por payku. — máximo 20 caracteres |

**CURL**

```text
curl -X DELETE \
https://BASE_URL/api/maclient/id \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('DELETE', 'https://BASE_URL/api/maclient/madb93fc00a2cf6f4449', [
      'headers' => [
        'Authorization' => 'Bearer TOKEN_PUBLICO'              ]
      ])->getBody();
    $response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/maclient/madb93fc00a2cf6f4449', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "status": "suspended",
  "id": "madb93fc00a2cf6f4449"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de cliente. — Ejemplo: `suspended` |
| `id` | string |  | Identificador creado por payku. — Ejemplo: `madb93fc00a2cf6f4449` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Crear afiliación

`POST /api/maaffiliation`

Este método permite registrar los datos para la afiliación.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `name` | string | ✓ | Nombre de afiliación. — máximo 80 caracteres — Ejemplo: `name` |
| `percentage` | string | ✓ | Porcentaje correspondiente al usuario payku. — máximo 2 caracteres — Ejemplo: `20` |
| `affiliation` | array of anys | ✓ | Arreglo que contiene los clientes, cada cliente es un arreglo que contiene un identificador de cliente creado por payku y el porcentaje que este obtendrá. — máximo 25 caracteres — Ejemplo: `[["madb93fc00a2cf6f4449","80"]]` |

**CURL**

```text
curl -X POST \
https://BASE_URL/api/maaffiliation \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "name": "name",
    "percentage": "20",
    "affiliation": [
      ["ma9fd16221a9645b0036","80"]
    ]
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/maaffiliation', [
    'json' => [
      'name' => 'name',
      'percentage' => '20',
      'affiliation' => [
        [ma9fd16221a9645b0036,80]
      ]
    ],
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/maaffiliation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  name: "name",
  percentage: "20",
  affiliation: [
    ["ma9fd16221a9645b0036","80"]
  ]
};

request(data);
```

**Respuestas**

*200*

```json
{
  "id": "sucaab7865dceaff49d8b3",
  "status": "register",
  "name": "name",
  "token": "eecd92fdbb8bf615e8215d6fbb30bb6ae6f82c9e1810f85b65bbeb472794c4a4",
  "percentage": "20.00",
  "affiliations": [
    {
      "id": "ma9fd16221a9645b0036",
      "name": "name",
      "percentage": "80.00"
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string |  | Identificador único de suscripción por payku. — Ejemplo: `sucaab7865dceaff49d8b3` |
| `status` | string |  | Estatus. — Ejemplo: `register` |
| `name` | string |  | Nombre de la afiliación. — Ejemplo: `name` |
| `token` | string |  | Token de afiliación que se ingresa en el comercio. — Ejemplo: `eecd92fdbb8bf615e8215d6fbb30bb6ae6f82c9e1810f85b65bbeb472794c4a4` |
| `percentage` | string |  | Porcentaje de afiliación usuario payku. — Ejemplo: `20.00` |
| `affiliations` | array of objects |  |  |
| ↳ `id` | string |  | Identificar. — Ejemplo: `ma9fd16221a9645b0036` |
| ↳ `name` | string |  | Nombre del afiliado. — Ejemplo: `name` |
| ↳ `percentage` | string |  | Porcentaje correspondiente a cada afiliado. — Ejemplo: `80.00` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener afiliación

`GET /api/maaffiliation/{identificadorCliente}`

Este método permite obtener el detalle de una afiliación.

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | Identificador único de afiliación por payku. — máximo 20 caracteres |

**CURL**

```text
curl -X GET \
https://BASE_URL/api/maaffiliation/id \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/maaffiliation/sucaab7865dceaff49d8b3', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/maaffiliation/sucaab7865dceaff49d8b3', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "id": "sucaab7865dceaff49d8b3",
  "status": "register",
  "name": "name",
  "token": "eecd92fdbb8bf615e8215d6fbb30bb6ae6f82c9e1810f85b65bbeb472794c4a4",
  "percentage": "20.00",
  "affiliations": [
    {
      "id": "ma9fd16221a9645b0036",
      "name": "name",
      "percentage": "80.00"
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string |  | Identificador único de suscripción por payku. — Ejemplo: `sucaab7865dceaff49d8b3` |
| `status` | string |  | Estatus. — Ejemplo: `register` |
| `name` | string |  | Nombre de la afiliación. — Ejemplo: `name` |
| `token` | string |  | Token de afiliación que se ingresa en el comercio. — Ejemplo: `eecd92fdbb8bf615e8215d6fbb30bb6ae6f82c9e1810f85b65bbeb472794c4a4` |
| `percentage` | string |  | Porcentaje de afiliación usuario payku. — Ejemplo: `20.00` |
| `affiliations` | array of objects |  |  |
| ↳ `id` | string |  | Identificar. — Ejemplo: `ma9fd16221a9645b0036` |
| ↳ `name` | string |  | Nombre del afiliado. — Ejemplo: `name` |
| ↳ `percentage` | string |  | Porcentaje correspondiente a cada afiliado. — Ejemplo: `80.00` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Eliminar afiliación

`DELETE /api/maaffiliation/{identificadorCliente}`

Este método permite la eliminación de una afiliación asociada a un ID.

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | Identificador único de cliente por payku. — máximo 20 caracteres |

**CURL**

```text
curl -X DELETE \
https://BASE_URL/api/maaffiliation/id \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('DELETE', 'https://BASE_URL/api/maaffiliation/madb93fc00a2cf6f4449', [
      'headers' => [
        'Authorization' => 'Bearer TOKEN_PUBLICO'              ]
      ])->getBody();
    $response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/maaffiliation/sucaab7865dceaff49d8b3', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "status": "suspended",
  "id": "maab4462d6133e05e518"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de afiliación. — Ejemplo: `suspended` |
| `id` | string |  | Identificador creado por payku. — Ejemplo: `maab4462d6133e05e518` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Crear transacción marketplace

`POST /api/transaction/`

Este método permite crear una orden de pago a **payku** y recibe como respuesta la **URL** para redirigir el browser del pagador y el **token** que identifica la transacción. Una vez que el pagador efectúe el pago exitoso, **payku** notificará el resultado a la página del comercio que se envió en el parámetro **urlnotify**.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | string | ✓ | Email del usuario — máximo 50 caracteres — Ejemplo: `johndoe@example.com` |
| `order` | string | ✓ | Orden del comercio, este debe ser único. — máximo 40 caracteres — Ejemplo: `98745` |
| `subject` | string | ✓ | Descripción de la orden. — máximo 2000 caracteres — Ejemplo: `payment description` |
| `amount` | integer | ✓ | Monto de la orden. — máximo 14 dígitos — Ejemplo: `25000` |
| `payment` | integer |  | Identificador del medio de pago. Si se envía el identificador, el pagador será redireccionado directamente al medio de pago que se indique. - 1 Webpay - 4 Etpay (Transferencia) - 6 Pago46 - 9 Mach - 19 Fintoc (Transferencia) - 23 Tenpo - 26 Floid (Transferencia) - 99 Todos — máximo 2 caracteres — Ejemplo: `1` |
| `urlreturn` | string |  | url de retorno del comercio donde payku redirigirá al pagador. — máximo 200 caracteres — Ejemplo: `https://youwebsite.com/urlreturn?orderClient=98745` |
| `urlnotify` | string |  | url callback del comercio donde payku notificara el pago. — máximo 600 caracteres — Ejemplo: `https://www.youwebsite.com/urlnotify?orderClient=98745` |
| `marketplace` | string |  | atributo obligatorio para realizar transacciones a afiliación de Marketplace, este consiste en el token de la afiliación de marketplace a la que se le desea realizar la transacción. — máximo 70 caracteres — Ejemplo: `c1c879f4862d393ea6b326a313022dd98f0baa2869d3e9095c124199c9941030` |

**cURL**

```bash
curl -X POST \
https://BASE-URL/api/transaction \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
-d '{
  "email": "johndoe@example.com",
  "order": "5696",
  "subject": "Cliente Test",
  "amount": 25000,
  "payment": 1,
  "urlreturn": "https://youwebsite.com/urlreturn?orderClient=5696",
  "urlnotify": "https://youwebsite.com/urlnotify?orderClient=5696",
  "marketplace": "c1c879f4862d393ea6b326a313022dd98f0baa2869d3e9095c124199c9941030"
}'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/transaction', [
    'json' => [
      'email' => 'johndoe@example.com',
      'order' => "98745",
      'subject' => 'Client Test',
      'amount' => 25000,
      'payment' => 1,
      'urlreturn' => 'https://youwebsite.com/urlreturn?orderClient=98745',
      'urlnotify' => 'https://www.youwebsite.com/urlnotify?orderClient=98745'
      'marketplace' => 'c1c879f4862d393ea6b326a313022dd98f0baa2869d3e9095c124199c9941030'
      ],
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  email: "johndoe@example.com",
  order: "98745",
  subject: "payment description",
  amount: 25000,
  payment: 1,
  urlreturn: "https://youwebsite.com/urlreturn?orderClient=98745",
  urlnotify: "https://www.youwebsite.com/urlnotify?orderClient=98745",
  marketplace: "c1c879f4862d393ea6b326a313022dd98f0baa2869d3e9095c124199c9941030"
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "pending",
  "id": "trx3b4d77b43acd9a720",
  "url": "https://BASE_URL/url_de_pago"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - rejected — Ejemplo: `pending` |
| `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `trx3b4d77b43acd9a720` |
| `url` | string |  | URL a redireccionar al usuario. — Ejemplo: `https://BASE_URL/url_de_pago` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

## Mall

El producto ha sido diseñado especialmente para aquellas empresas integradoras de distintas marcas con diferentes líneas de negocio las cuales pueden agruparse manteniendo su diversidad en un mismo espacio virtual o mall.

Ofreciendo la posibilidad de agrupar el pago de las compras realizadas en múltiples tiendas virtuales en una sola transacción.
<br>
<div class='container'>
  <img src='https://docs.payku.com/img/diagrams/Diagrama-Mall.png' alt='Avatar' class='image' style='width:100%'>
  <div class='middle'>
    <a target='_blank' href='https://docs.payku.com/img/diagrams/Diagrama-Mall.png' class='text'>Ver diagrama</a>
  </div>
</div>

### Crear transacción Mall

`POST /api/mall`

Esto método permite la inserción de datos de una transacción.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | string | ✓ | Email del cliente. — máximo 50 caracteres — Ejemplo: `joedoe@example.com` |
| `payment` | integer | ✓ | Identificador del medio de pago. Si se envía el identificador, el pagador será redireccionado directamente al medio de pago que se indique. - 1 Webpay - 4 Etpay (Transferencia) - 6 Pago46 - 9 Mach - 19 Fintoc (Transferencia) - 23 Tenpo - 26 Floid (Transferencia) - 99 Todos — máximo 2 caracteres — Ejemplo: `1` |
| `merchant` | array of arrays | ✓ | Arreglo que contiene los clientes, cada cliente es un arreglo que contiene su token público o id de afiliación de marketplace, valor de transacción, descripción, id del evento en especifico que si no posee debe pasar null y numero de orden individual. — máximo 200 caracteres — Ejemplo: `[["81b6179e4feeef2b50af71d660f830de",30000,"item1",null,"4545"],["81b6179e4feeef2b50af71d66f7830de",25000,"item2",null,"4546"],["81b6179e4fffff2b50af71d66f7830de",15000,"item3",null,"4547"]]` |
| `order` | integer | ✓ | Orden del comercio, este debe ser único. — máximo 40 caracteres — Ejemplo: `123` |
| `urlreturn` | string | ✓ | url de retorno del comercio donde payku redirigirá al pagador. — máximo 200 caracteres — Ejemplo: `https://youwebsite.com/urlreturn` |
| `urlnotify` | string |  | url callback del comercio donde payku notificará el pago. — máximo 600 caracteres — Ejemplo: `https://youwebsite.com/urlnotify` |

**CURL**

```text
curl -X POST \
https://BASE_URL/api/mall \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO  \
-H 'Authorization: Bearer TOKEN_PUBLICO  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "email": "joedoe@example.com",
    "payment": 1,
    "merchant": [
      ["81b6179e4feeef2b50af71d660f830de", "30000", "item1", null, "4545"],
      ["bcf6c06c523d9394be41bc0174c43d1476f274abb342955aac93cc8014737b3b","25000","item2", null, "4546"],
      ["TOKEN-PUBLICO","15000","item3", null, "4547"]
    ],
    "order": 123,
    "urlreturn": "https://youwebsite.com/urlreturn",
    "urlnotify": "https://youwebsite.com/urlnotify"
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/mall', [
    'json' => [
      'email'         => 'joedoe@example.com',
      'payment'       => 1,
      'merchant'      => [
        ['81b6179e4feeef2b50af71d660f830de', '30000', 'item1', null, '4545'],
        ['bcf6c06c523d9394be41bc0174c43d1476f274abb342955aac93cc8014737b3b','25000','item2', null, '4546'],
        ['TOKEN-PUBLICO','15000','item3', null, '4547']
      ],
      'order'         => 123,
      'urlreturn'     => 'https://youwebsite.com/urlreturn',
      'urlnotify'     => 'https://youwebsite.com/urlnotify'
      ],
    'headers' => [
      'Sign' => 'f96ddc14a73a4dd6e009db2514108a3f44832795cd5ac50e6a80fd0b0ae92112',
      'Authorization' => 'Bearer TOKEN-PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/mall', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'f96ddc14a73a4dd6e009db2514108a3f44832795cd5ac50e6a80fd0b0ae92112',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}
let data = {
  email: "joedoe@example.com",
  payment: 1,
  merchant: [
    ["81b6179e4feeef2b50af71d660f830de", "30000", "item1", null, "4545"],
    ["bcf6c06c523d9394be41bc0174c43d1476f274abb342955aac93cc8014737b3b","25000","item2", null, "4546"],
    ["TOKEN-PUBLICO","15000","item3", null, "4547"]
  ],
  order: 123,
  urlreturn: "https://youwebsite.com/urlreturn",
  urlnotify: "https://youwebsite.com/urlnotify"
};
request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "id": "malld200058ab44739ddee2adcd2f5",
  "individual_orders": [
    {
      "merchant": "81b6179e4feeef2b50af71d660f830de",
      "amount": 30000,
      "subject": "item1",
      "event": null,
      "identificador": "9917068816213146",
      "individual_order": "9654"
    },
    {
      "merchant": "81b6179e4feeef2b50af71d66f7830de",
      "amount": 25000,
      "subject": "item2",
      "event": null,
      "identificador": "9917068816213146",
      "individual_order": "9654"
    },
    {
      "merchant": "81b6179e4fffff2b50af71d66f7830de",
      "amount": 15000,
      "subject": "item3",
      "event": null,
      "identificador": "9917068816213146",
      "individual_order": "9654"
    }
  ],
  "url": "https://BASE_URL/gateway/mall/malld200058ab44739ddee2adcd2f5"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - rejected - refunded partial - refunded — Ejemplo: `success` |
| `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `malld200058ab44739ddee2adcd2f5` |
| `individual_orders` | array of objects |  | Arreglo que contiene información de los beneficiarios. — Ejemplo: `[{"merchant":"81b6179e4feeef2b50af71d660f830de","amount":30000,"subject":"item1","event":null,"identificador":"9917068816213146","individual_order":"9654"},{"merchant":"81b6179e4feeef2b50af71d66f7830de","amount":25000,"subject":"item2","event":null,"identificador":"9917068816213146","individual_order":"9654"},{"merchant":"81b6179e4fffff2b50af71d66f7830de","amount":15000,"subject":"item3","event":null,"identificador":"9917068816213146","individual_order":"9654"}]` |
| ↳ `merchant` | string |  | Nombre del beneficiario. |
| ↳ `amount` | string |  | Monto del producto o servicio. |
| ↳ `detail` | string |  | Descripción de la transacción. |
| ↳ `event` | string |  | ID del evento, si no poseé evento debe pasar null. |
| ↳ `identificador` | string |  | Identificador de la transacción. — Ejemplo: `9917068816213146` |
| ↳ `individual_order` | string |  | Identificador individual de la transacción. — Ejemplo: `4546` |
| `url` | string |  | URL a redireccionar al usuario. — Ejemplo: `https://BASE_URL/gateway/mall/malld200058ab44739ddee2adcd2f5` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Publico incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener transacción Mall

`GET /api/mall/{identificadorTrasaccion}`

Este método permite obtener la información de un pago realizado en **payku**

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | id de la transacción a solicitar — máximo 30 caracteres |

**CURL**

```text
curl -X GET \
https://BASE-URL/api/mall/ID-IDENTIFICADOR  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL ' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/mall/malld200058ab44739ddee2adcd2f5', [
    'headers' => [
      'Sign' => 'f96ddc14a73a4dd6e009db2514108a3f44832795cd5ac50e6a80fd0b0ae92112',
      'Authorization' => 'Bearer TOKEN-PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/mall/malld200058ab44739ddee2adcd2f5', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Sign' => 'f96ddc14a73a4dd6e009db2514108a3f44832795cd5ac50e6a80fd0b0ae92112',
      'Authorization' => 'Bearer TOKEN-PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}
request();
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "id": "malld200058ab44739ddee2adcd2f5",
  "created_at": "2023-10-16 11:23:19",
  "amount": "30000",
  "payment": {
    "media": "Webpay",
    "verification_key": "d60aaa661ea74d824373806c8aa38137",
    "authorization_code": "441864",
    "last_4_digits": "5135",
    "card_type": "",
    "currency": "CLP"
  },
  "merchant": [
    {
      "name": "John Doe",
      "amount": 30000,
      "subject": "item1"
    },
    {
      "name": "Jane Doe",
      "amount": 25000,
      "subject": "item2"
    },
    {
      "name": "Enteprise",
      "amount": 15000,
      "subject": "item3"
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - rejected - refunded partial - refunded — Ejemplo: `success` |
| `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `malld200058ab44739ddee2adcd2f5` |
| `created_at` | string |  | Fecha de registro. — Ejemplo: `2023-10-16 11:23:19` |
| `amount` | string |  | Monto. — Ejemplo: `30000` |
| `payment` | object |  |  |
| ↳ `media` | string |  | Medio de pago, utilizado por el usuario. — Ejemplo: `Webpay` |
| ↳ `verification_key` | string |  | Código de verificación creado por payku. — Ejemplo: `d60aaa661ea74d824373806c8aa38137` |
| ↳ `authorization_code` | string |  | Código de autorización. — Ejemplo: `441864` |
| ↳ `last_4_digits` | string |  | Últimos 4 dígitos de la tarjeta afiliada. — Ejemplo: `5135` |
| ↳ `card_type` | string |  | Tipo de tarjeta. — Ejemplo: `` |
| ↳ `currency` | string |  | Moneda. — Ejemplo: `CLP` |
| `merchant` | array of objects |  | Arreglo que contiene información de los beneficiarios. — Ejemplo: `[{"name":"John Doe","amount":30000,"subject":"item1"},{"name":"Jane Doe","amount":25000,"subject":"item2"},{"name":"Enteprise","amount":15000,"subject":"item3"}]` |
| ↳ `name` | string |  | Nombre del beneficiario. |
| ↳ `amount` | string |  | Monto del producto o servicio. |
| ↳ `subject` | string |  | Descripción del producto o servicio. |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Publico incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

## Evento

Permite la  creación de eventos y posteriormente consultar su estado.

### Crear un evento

`POST /api/event`

Este método permite crear un evento y recibir como respuesta el detalle del evento.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `event` | string | ✓ | Indicador del evento. — máximo 40 caracteres — Ejemplo: `98374` |
| `name` | string | ✓ | Nombre del evento. — máximo 400 caracteres — Ejemplo: `Event` |
| `date_event` | datetime | ✓ | Fecha en la cual se realizara el evento. — Ejemplo: `2023-12-20` |
| `date_closing_sales` | datetime | ✓ | Fecha de cierre de las ventas, debe ser menor o igual a date_event. — Ejemplo: `2023-12-19 23:59:00` |
| `date_payment` | datetime | ✓ | Fecha de pago del evento, debe ser mayor a la fecha date_event. — Ejemplo: `2023-12-20` |
| `url_event` | string |  | url en donde se encuentra publicado el evento. — máximo 240 caracteres — Ejemplo: `https://www.example.com/event1` |
| `url_logo` | string |  | url del logo que identifica al evento. — máximo 240 caracteres — Ejemplo: `https://www.example.com/logo_event1.png` |
| `service_sale` | integer |  | Monto del servicio de ventas, pertenece al monto que recibirá el dueño de la cuenta por transacción. — máximo 7 caracteres — Ejemplo: `10` |
| `affiliation` | array of objects |  | Distribución de los beneficiarios. |
| ↳ `email` | string |  | Email del beneficiario. — máximo 50 caracteres — Ejemplo: `afiliate1@domain.com` |
| ↳ `percent` | number |  | Porcentaje la cual le corresponde al beneficiario. — máximo 6 caracteres — Ejemplo: `50` |

**CURL**

```text
curl -X POST \
  https://BASE_URL/api/event \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Authorization: Bearer TOKEN_PUBLICO'  \
  -H 'Content-Type: application/json' \
  -H 'Host: BASE_URL' \
  -d {
    "name": "Event",
    "event": "98374",
    "date_event": "2023-12-20",
    "date_payment": "2023-12-22",
    "date_closing_sales": "2023-12-19 23:59:00",
    "url_logo": "https://www.example.com/logo_event1.png",
    "url_event": "https://www.example.com/event1",
    "service_sale": 10,
    "affiliation": [
      ["afiliate1@example.com",  50],
      ["afiliate2@example.com",  50]
    ]
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/event', [
    'json' => [
        'name' => 'Event',
        'event' => '98374',
        'date_event' => '2023-12-20',
        'date_payment' => '2023-12-22',
        'date_closing_sales' => '2023-12-19 23:59:00',
        'url_logo' => 'https://www.example.com/logo_event1.png',
        'url_event' => 'https://www.example.com/event1',
        'service_sale' => 10,
        'affiliation' => [
          ['afiliate1@example.com',  50],
          ['afiliate2@example.com',  50]
        ]
      ],
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  name: "Event",
  event: "98374",
  date_event: "2023-12-20",
  date_payment: "2023-12-22",
  date_closing_sales: "2023-12-19 23:59:00",
  url_logo: "https://www.example.com/logo_event1.png",
  url_event: "https://www.example.com/event1",
  service_sale: 10,
  affiliation: [
    ["afiliate1@example.com",  50],
    ["afiliate2@example.com",  50]
  ]
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "id": "98374",
  "event": "Event",
  "date_event": "2023-12-20",
  "date_payment": "2023-12-22",
  "date_closing_sales": "2023-12-19 23:59:00",
  "url_logo": "https://www.example.com/logo_event1.png",
  "url_event": "https://www.example.com/event1",
  "distribution": {
    "affiliate": "100.00",
    "service_sale": "10.00"
  },
  "affiliation": [
    {
      "id": "b99dfd8193ebfd37d4b9",
      "email": "afiliate1@domain.com",
      "percent": "100.00",
      "status": "pending"
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `success` |
| `id` | string |  | Identificador del evento. — Ejemplo: `98374` |
| `event` | string |  | Nombre del evento. — Ejemplo: `Event` |
| `date_event` | datetime |  | Fecha en la cual se realizara el evento. — Ejemplo: `2023-12-20` |
| `date_payment` | datetime |  | Fecha de pago del evento, debe ser mayor a la fecha date_event . — Ejemplo: `2023-12-22` |
| `date_closing_sales` | datetime |  | Fecha de cierre de las ventas, debe ser menor o igual a date_event. — Ejemplo: `2023-12-19 23:59:00` |
| `url_logo` | string |  | url del logo que pertenece al evento . — Ejemplo: `https://www.example.com/logo_event1.png` |
| `url_event` | string |  | url en donde se encuentra publicado el evento. — Ejemplo: `https://www.example.com/event1` |
| `distribution` | object |  | Distribución de las transacciones. |
| ↳ `affiliate` | string |  | Monto a distribuir a los beneficiarios. — Ejemplo: `100.00` |
| ↳ `service_sale` | string |  | Monto a distribuir en el servicio de venta . — Ejemplo: `10.00` |
| `affiliation` | array of objects |  |  |
| ↳ `id` | string |  | Identificador del beneficiario. — Ejemplo: `b99dfd8193ebfd37d4b9` |
| ↳ `email` | string |  | Correo del beneficiario. — Ejemplo: `afiliate1@domain.com` |
| ↳ `percent` | string |  | Porcentaje la cual le corresponde al beneficiario. — Ejemplo: `100.00` |
| ↳ `status` | string |  | Estatus del beneficiario. — Ejemplo: `pending` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener evento

`GET /api/event/{identificadorEvento}`

Este método permite obtener el detalle de un evento.

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | id del evento a solicitar — máximo 40 caracteres |

**CURL**

```text
curl -X GET \
  https://BASE_URL/api/event \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Authorization: Bearer TOKEN_PUBLICO'  \
  -H 'Content-Type: application/json' \
  -H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/event/98374', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/event/98374', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request(data);
```

**Respuestas**

*200*

```json
{
  "id": "98374",
  "event": "Event",
  "date_event": "2023-12-20",
  "date_payment": "2023-12-22",
  "date_closing_sales": "2023-12-19 23:59:00",
  "url_logo": "https://www.example.com/logo_event1.png",
  "url_event": "https://www.example.com/event1",
  "distribution": {
    "affiliate": "100.00",
    "service_sale": "10.00"
  },
  "affiliations": [
    {
      "id": "b99dfd8193ebfd37d4b9",
      "email": "afiliate1@domain.com",
      "percent": "100.00",
      "status": "pending"
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string |  | Identificador del evento. — Ejemplo: `98374` |
| `event` | string |  | Nombre del evento. — Ejemplo: `Event` |
| `date_event` | datetime |  | Fecha en la cual se realizara el evento. — Ejemplo: `2023-12-20` |
| `date_payment` | datetime |  | Fecha de pago del evento, debe ser mayor a la fecha date_event . — Ejemplo: `2023-12-22` |
| `date_closing_sales` | datetime |  | Fecha de cierre de las ventas, debe ser menor o igual a date_event. — Ejemplo: `2023-12-19 23:59:00` |
| `url_logo` | string |  | url del logo que pertenece al evento . — Ejemplo: `https://www.example.com/logo_event1.png` |
| `url_event` | string |  | url en donde se encuentra publicado el evento. — Ejemplo: `https://www.example.com/event1` |
| `distribution` | object |  | Distribución de las transacciones. |
| ↳ `affiliate` | string |  | Monto a distribuir a los beneficiarios. — Ejemplo: `100.00` |
| ↳ `service_sale` | string |  | Monto a distribuir en el servicio de venta . — Ejemplo: `10.00` |
| `affiliations` | array of objects |  |  |
| ↳ `id` | string |  | Identificador del beneficiario. — Ejemplo: `b99dfd8193ebfd37d4b9` |
| ↳ `email` | string |  | Correo del beneficiario. — Ejemplo: `afiliate1@domain.com` |
| ↳ `percent` | string |  | Porcentaje la cual le corresponde al beneficiario. — Ejemplo: `100.00` |
| ↳ `status` | string |  | Estatus del beneficiario. — Ejemplo: `pending` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

## Suscripción

Permite la vinculación de un plan a un cliente, para posteriormente realizar cargos recurrentes automáticamente, según se defina en cada plan.
<br>
<div class='container'>
  <img src='https://docs.payku.com/img/diagrams/Diagrama-Suscripcion.png' alt='Avatar' class='image' style='width:100%'>
  <div class='middle'>
    <a target='_blank' href='https://docs.payku.com/img/diagrams/Diagrama-Suscripcion.png' class='text'>Ver diagrama</a>
  </div>
</div>

### Crear cliente

`POST /api/suclient`

Este método permite la inserción de datos de un cliente.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | string | ✓ | Email del cliente. — máximo 50 caracteres — Ejemplo: `johndoe@example.com` |
| `name` | string | ✓ | Nombre del cliente — máximo 80 caracteres — Ejemplo: `John Doe` |
| `rut` | string |  | Registro Único Tributario del cliente, será permitido el ingreso de este dato con ó sin guión. — 12 caracteres requeridos — Ejemplo: `11111111` |
| `phone` | string | ✓ | Teléfono del cliente. — 20 caracteres requeridos — Ejemplo: `923122312` |
| `address` | string |  | Dirección del cliente. — máximo 200 caracteres — Ejemplo: `Moneda 101` |
| `country` | string |  | País del cliente. — máximo 40 caracteres — Ejemplo: `Chile` |
| `region` | string |  | Región del cliente. — máximo 120 caracteres — Ejemplo: `Metropolitana` |
| `city` | string |  | Ciudad del cliente. — máximo 40 caracteres — Ejemplo: `Santiago` |
| `postal_code` | string |  | Código postal del cliente. — máximo 10 caracteres — Ejemplo: `850000` |
| `additional_parameters` | object |  | Parámetros adicionales del cliente (Opcional). — máximo 4000 caracteres |
| ↳ `parameter_1` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |
| ↳ `parameter_2` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |

**CURL**

```text
curl -X POST \
https://BASE_URL/api/suclient \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "email": "johndoe@example.com",
    "name": "John Doe",
    "rut": "111111111",
    "phone": "923122312",
    "address": "Moneda 101",
    "country": "Chile",
    "region": "Metropolitana",
    "city": "Santiago",
    "postal_code": "850000,
    "additional_parameters":{
      "parameter_1": "example",
      "parameter_2": "example 2",
    }
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/suclient', [
    'json' => [
      'email' => 'johndoe@example.com',
      'name' => 'John Doe',
      'rut' => '111111111',
      'phone' => '923122312',
      'address' => 'Moneda 101',
      'country' => 'Chile',
      'region' => 'Metropolitana',
      'city' => 'Santiago',
      'postal_code' => '850000',
      'additional_parameters' => [
          'parameter_1' => 'example',
          'parameter_2' => 'example 2'
        ]
      ],
    'headers' => [
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/suclient', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  email: "johndoe@example.com",
  name: "John Doe",
  rut: "111111111",
  phone: "923122312",
  address: "Moneda 101",
  country: "Chile",
  region: "Metropolitana",
  city: "Santiago",
  postal_code: "850000",
  additional_parameters:{
    parameter_1: "example",
    parameter_2: "example 2",
  }
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "active",
  "id": "cl0be4c8e623c167bc8b777",
  "rut": "11111111",
  "name": "John Doe",
  "phone": "923122312",
  "email": "johndoe@example.com",
  "address": "Moneda 101",
  "country": "Chile",
  "region": "Metropolitana",
  "city": "Santiago",
  "postal_code": "850000",
  "created_at": "2023-09-29",
  "update_at": null,
  "subcriptions": null,
  "additional_parameters": {
    "parameter_1": "example",
    "parameter_2": "example"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus del cliente. — Ejemplo: `active` |
| `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `cl0be4c8e623c167bc8b777` |
| `rut` | string |  | Registro Único Tributario del cliente. — Ejemplo: `11111111` |
| `name` | string |  | Nombre del cliente. — Ejemplo: `John Doe` |
| `phone` | string |  | Teléfono del cliente. — Ejemplo: `923122312` |
| `email` | string |  | Email del cliente. — Ejemplo: `johndoe@example.com` |
| `address` | string |  | Dirección del cliente. — Ejemplo: `Moneda 101` |
| `country` | string |  | País del cliente. — Ejemplo: `Chile` |
| `region` | string |  | Región del cliente. — Ejemplo: `Metropolitana` |
| `city` | string |  | Ciudad del cliente. — Ejemplo: `Santiago` |
| `postal_code` | string |  | Código postal del cliente. — Ejemplo: `850000` |
| `created_at` | string |  | Fecha de registro. — Ejemplo: `2023-09-29` |
| `update_at` | string |  | Fecha de modificación. |
| `subcriptions` | object |  | suscripciones del cliente. |
| `additional_parameters` | object |  | Parámetros adicionales del cliente (Opcional). |
| ↳ `parameter_1` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |
| ↳ `parameter_2` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener cliente

`GET /api/suclient/{identificadorCliente} o {emailCliente}`

Este método permite obtener el detalle de un cliente.

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | Identificador único de transacción por payku o email del cliente. — máximo 20 caracteres |

**CURL**

```text
curl -X GET \
https://BASE_URL/api/suclient/id \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/suclient/cla90927fa9b30e1dfffa0', [
    'headers' => [
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/suclient/cla90927fa9b30e1dfffa0', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "active",
  "id": "cl0be4c8e623c167bc8b777",
  "rut": "11111111",
  "name": "John Doe",
  "phone": "923122312",
  "email": "johndoe@example.com",
  "address": "Moneda 101",
  "city": "Santiago",
  "region": "Metropolitana",
  "country": "Chile",
  "postal_code": "850000",
  "created_at": "2023-09-29 22:00:00",
  "update_at": null,
  "active_cards": [
    {
      "last_4_digits": "XXXXXXXXXXXX6622",
      "identifier": "surec804a8ed60c747cb8839",
      "card_type": "Visa",
      "register": "2023-07-26 08:00:19"
    },
    {
      "last_4_digits": "XXXXXXXXXXXX1234",
      "identifier": "surec804a8ed60c747cb8843",
      "card_type": "MasterCard",
      "register": "2023-01-01 12:00:00"
    }
  ],
  "additional_parameters": {
    "parameter_1": "example",
    "parameter_2": "example"
  },
  "subcriptions": {
    "id": "su867f07772aa5f5175527",
    "created_at": "2023-09-29 19:58:35",
    "status": "active",
    "amount": "15000",
    "plan": [
      {
        "id": "pl9697fb170834ad42dd00",
        "name": "test plan",
        "currency": "CLP"
      }
    ],
    "cards": [
      {
        "last_4_digits": "XXXXXXXXXXXX6623",
        "card_type": "Visa"
      }
    ],
    "transactions": [
      {
        "created_at": "2023-09-30 19:58:35",
        "date_payment": "2023-09-30",
        "amount": 10000,
        "transaction": 204444,
        "authorization_code": "1234",
        "order": "001",
        "description": "descripcion",
        "status": "success"
      }
    ]
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus del cliente. — Ejemplo: `active` |
| `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `cl0be4c8e623c167bc8b777` |
| `rut` | string |  | Registro Único Tributario del cliente. — Ejemplo: `11111111` |
| `name` | string |  | Nombre del cliente. — Ejemplo: `John Doe` |
| `phone` | string |  | Teléfono del cliente. — Ejemplo: `923122312` |
| `email` | string |  | Email del cliente. — Ejemplo: `johndoe@example.com` |
| `address` | string |  | Dirección del cliente. — Ejemplo: `Moneda 101` |
| `city` | string |  | Ciudad del cliente. — Ejemplo: `Santiago` |
| `region` | string |  | Región del cliente. — Ejemplo: `Metropolitana` |
| `country` | string |  | País del cliente. — Ejemplo: `Chile` |
| `postal_code` | string |  | Código postal del cliente. — Ejemplo: `850000` |
| `created_at` | string |  | Fecha de registro. — Ejemplo: `2023-09-29 22:00:00` |
| `update_at` | string |  | Fecha de modificación. |
| `active_cards` | array of objects |  | Ejemplo: `[{"last_4_digits":"XXXXXXXXXXXX6622","identifier":"surec804a8ed60c747cb8839","card_type":"Visa","register":"2023-07-26 08:00:19"},{"last_4_digits":"XXXXXXXXXXXX1234","identifier":"surec804a8ed60c747cb8843","card_type":"MasterCard","register":"2023-01-01 12:00:00"}]` |
| ↳ `last_4_digits` | string |  | Últimos 4 dígitos de la tarjeta afiliada. — Ejemplo: `XXXXXXXXXXXX6622` |
| ↳ `identifier` | string |  | identificador de la tarjeta. — Ejemplo: `surec804a8ed60c747cb8839` |
| ↳ `card_type` | string |  | Tipo de tarjeta. — Ejemplo: `Visa` |
| ↳ `register` | string |  | Fecha de registro. — Ejemplo: `2023-07-26 08:00:19` |
| `additional_parameters` | object |  | Parámetros adicionales del cliente (Opcional). |
| ↳ `parameter_1` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |
| ↳ `parameter_2` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |
| `subcriptions` | object |  |  |
| ↳ `id` | string |  | Identificador de la suscripción creado por payku. — Ejemplo: `su867f07772aa5f5175527` |
| ↳ `created_at` | string |  | Fecha de registro. — Ejemplo: `2023-09-29 19:58:35` |
| ↳ `status` | string |  | Estatus de la suscripción. Los posibles estados que puede obtener son los siguientes: - register - active - finish - delete - cancel - suspended — Ejemplo: `active` |
| ↳ `amount` | string |  | Monto de la suscripción. — Ejemplo: `15000` |
| ↳ `plan` | array of objects |  |  |
| ↳ ↳ `id` | string |  | Identificador del plan creado por payku. — Ejemplo: `pl9697fb170834ad42dd00` |
| ↳ ↳ `name` | string |  | Nombre del plan. — Ejemplo: `test plan` |
| ↳ ↳ `currency` | string |  | Moneda. — Ejemplo: `CLP` |
| ↳ `cards` | array of objects |  |  |
| ↳ ↳ `last_4_digits` | string |  | Últimos 4 dígitos de la tarjeta afiliada. — Ejemplo: `XXXXXXXXXXXX6623` |
| ↳ ↳ `card_type` | string |  | Tipo de tarjeta. — Ejemplo: `Visa` |
| ↳ `transactions` | array of objects |  |  |
| ↳ ↳ `created_at` | string |  | Fecha de creación de la transacción. — Ejemplo: `2023-09-30 19:58:35` |
| ↳ ↳ `date_payment` | string |  | Fecha en que se realizo la transacción. — Ejemplo: `2023-09-30` |
| ↳ ↳ `amount` | int |  | Monto de transacción. — Ejemplo: `10000` |
| ↳ ↳ `transaction` | int |  | Número de transacción. — Ejemplo: `204444` |
| ↳ ↳ `authorization_code` | string |  | Código de autorización. — Ejemplo: `1234` |
| ↳ ↳ `order` | string |  | Número de orden. — Ejemplo: `001` |
| ↳ ↳ `description` | string |  | Descripción. — Ejemplo: `descripcion` |
| ↳ ↳ `status` | string |  | Estatus de transacción. Los posibles estados que puede obtener son los siguientes: - pending - success - retry - canceled by customer - canceled by paymaster - canceled by payku - maximum attempt limit - first payment rejected - payment consumes failed — Ejemplo: `success` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Actualizar cliente

`PUT /api/suclient/{identificadorCliente} o {emailCliente}`

Este método permite la actualización de los datos de un cliente.

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | Identificador único de transacción por payku. — máximo 20 caracteres |

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | string |  | Nombre del cliente — máximo 50 caracteres — Ejemplo: `johndoe@example.com` |
| `name` | string |  | Nombre del cliente — máximo 80 caracteres — Ejemplo: `John Doe Doe` |
| `phone` | string |  | Teléfono del cliente. — máximo 20 caracteres — Ejemplo: `923122312` |
| `address` | string |  | Dirección del cliente. — máximo 200 caracteres — Ejemplo: `Moneda 121` |
| `country` | string |  | País del cliente. — máximo 40 caracteres — Ejemplo: `Chile` |
| `region` | string |  | Región del cliente. — máximo 120 caracteres — Ejemplo: `Metropolitana` |
| `city` | string |  | Ciudad del cliente. — máximo 40 caracteres — Ejemplo: `Santiago` |
| `postal_code` | string |  | Código postal del cliente. — máximo 10 caracteres — Ejemplo: `750000` |
| `additional_parameters` | object |  | Parámetros adicionales del cliente (Opcional). — máximo 4000 caracteres |
| ↳ `parameter_1` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |
| ↳ `parameter_2` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |

**CURL**

```text
curl -X PUT \
https://BASE_URL/api/suclient/id \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "email": "johndoe@example.com",
    "name": "John Doe Doe",
    "phone": "923122312",
    "address": "Moneda 121",
    "country": "Chile",
    "region": "Metropolitana",
    "city": "Santiago",
    "postal_code": "750000",
    "additional_parameters":{
      "parameter_1": "example",
      "parameter_2": "example 2",
    }
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('PUT', 'https://BASE_URL//api/suclient/cla90927fa9b30e1dfffa0', [
    'json' => [
      'email' => 'johndoe@example.com',
      'name' => 'John Doe Doe',
      'phone' => '923122312',
      'address' => 'Moneda 121',
      'country' => 'Chile',
      'region'  => 'Metropolitana',
      'city'    => 'Santiago',
      'postal_code' => '750000',
      'additional_parameters' => [
          'parameter_1' => 'example',
          'parameter_2' => 'example 2'
        ]
      ],
    ],
  ],
  'headers' => [
    'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
    'Authorization' => 'Bearer TOKEN_PUBLICO'
  ]
])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/suclient', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  email: "johndoe@example.com",
  name: "John Doe Doe",
  phone: "923122312",
  address: "Moneda 121",
  country: "Chile",
  region: "Metropolitana",
  city: "Santiago",
  postal_code: "750000",
  additional_parameters:{
    parameter_1: "example",
    parameter_2: "example 2",
  }
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "active",
  "id": "cl0be4c8e623c167bc8b777",
  "name": "John Doe Doe",
  "phone": "923122312",
  "email": "johndoe@example.com",
  "address": "Moneda 121",
  "city": "Santiago",
  "region": "Metropolitana",
  "country": "Chile",
  "postal_code": "750000",
  "created_at": "2023-09-29 22:00:00",
  "update_at": "2023-10-2 08:32:52",
  "additional_parameters": {
    "parameter_1": "example",
    "parameter_2": "example"
  },
  "subcriptions": {
    "id": "su867f07772aa5f5175527",
    "created_at": "2023-09-29 19:58:35",
    "status": "active",
    "amount": "15000",
    "plan": [
      {
        "id": "pl9697fb170834ad42dd00",
        "name": "test plan",
        "currency": "CLP"
      }
    ],
    "cards": [
      {
        "last_4_digits": "XXXXXXXXXXXX6623",
        "card_type": "Visa"
      }
    ],
    "transactions": [
      {
        "created_at": "2023-09-30 19:58:35",
        "date_payment": "2023-09-30",
        "amount": 10000,
        "transaction": 204444,
        "authorization_code": "1234",
        "order": "001",
        "description": "descripcion",
        "status": "success"
      }
    ]
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus del cliente. — Ejemplo: `active` |
| `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `cl0be4c8e623c167bc8b777` |
| `name` | string |  | Nombre del cliente. — Ejemplo: `John Doe Doe` |
| `phone` | string |  | Teléfono del cliente. — Ejemplo: `923122312` |
| `email` | string |  | Email del cliente. — Ejemplo: `johndoe@example.com` |
| `address` | string |  | Dirección del cliente. — Ejemplo: `Moneda 121` |
| `city` | string |  | Ciudad del cliente. — Ejemplo: `Santiago` |
| `region` | string |  | Región del cliente. — Ejemplo: `Metropolitana` |
| `country` | string |  | País del cliente. — Ejemplo: `Chile` |
| `postal_code` | string |  | Código postal del cliente. — Ejemplo: `750000` |
| `created_at` | string |  | Fecha de registro. — Ejemplo: `2023-09-29 22:00:00` |
| `update_at` | string |  | Fecha de modificación. — Ejemplo: `2023-10-2 08:32:52` |
| `additional_parameters` | object |  | Parámetros adicionales del cliente (Opcional). |
| ↳ `parameter_1` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |
| ↳ `parameter_2` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |
| `subcriptions` | object |  |  |
| ↳ `id` | string |  | Identificador de la suscripción creado por payku. — Ejemplo: `su867f07772aa5f5175527` |
| ↳ `created_at` | string |  | Fecha de registro. — Ejemplo: `2023-09-29 19:58:35` |
| ↳ `status` | string |  | Estatus de la suscripción. Los posibles estados que puede obtener son los siguientes: - register - active - finish - delete - cancel - suspended — Ejemplo: `active` |
| ↳ `amount` | string |  | Monto de la suscripción. — Ejemplo: `15000` |
| ↳ `plan` | array of objects |  |  |
| ↳ ↳ `id` | string |  | Identificador del plan creado por payku. — Ejemplo: `pl9697fb170834ad42dd00` |
| ↳ ↳ `name` | string |  | Nombre del plan. — Ejemplo: `test plan` |
| ↳ ↳ `currency` | string |  | Moneda. — Ejemplo: `CLP` |
| ↳ `cards` | array of objects |  |  |
| ↳ ↳ `last_4_digits` | string |  | Últimos 4 dígitos de la tarjeta afiliada. — Ejemplo: `XXXXXXXXXXXX6623` |
| ↳ ↳ `card_type` | string |  | Tipo de tarjeta. — Ejemplo: `Visa` |
| ↳ `transactions` | array of objects |  |  |
| ↳ ↳ `created_at` | string |  | Fecha de creación de la transacción. — Ejemplo: `2023-09-30 19:58:35` |
| ↳ ↳ `date_payment` | string |  | Fecha en que se realizo la transacción. — Ejemplo: `2023-09-30` |
| ↳ ↳ `amount` | int |  | Monto de transacción. — Ejemplo: `10000` |
| ↳ ↳ `transaction` | int |  | Número de transacción. — Ejemplo: `204444` |
| ↳ ↳ `authorization_code` | string |  | Código de autorización. — Ejemplo: `1234` |
| ↳ ↳ `order` | string |  | Número de orden. — Ejemplo: `001` |
| ↳ ↳ `description` | string |  | Descripción. — Ejemplo: `descripcion` |
| ↳ ↳ `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - retry - canceled by customer - canceled by paymáster - canceled by payku - maximum attempt limit - first payment rejected - payment consumes failed — Ejemplo: `success` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Eliminar cliente

`DELETE /api/suclient/{identificadorCliente} o {emailCliente}`

Este método permite la eliminación de un cliente asociado a un ID de usuario.

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | Identificador único del cliente creado por payku. — máximo 20 caracteres |

**CURL**

```text
curl -X DELETE \
https://BASE_URL/api/suclient/id \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('DELETE', 'https://BASE_URL/api/suclient/cla90927fa9b30e1dfffa0', [
      'headers' => [
        'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
        'Authorization' => 'Bearer TOKEN_PUBLICO'              ]
      ])->getBody();
    $response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/suclient/cla90927fa9b30e1dfffa0', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "id": "cl0be4c8e623c167bc8b777"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de cliente. — Ejemplo: `success` |
| `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `cl0be4c8e623c167bc8b777` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener clientes

`GET /api/suclient/customers`

Este método permite obtener todos los clientes asociados a un ID de usuario , este método permite una paginación con un máximo de 100 registros por página, además, posee un filtro de fecha, si este parámetro no es ingresado se tomará la fecha actual, para la paginación es necesario agregar al final del endpoint lo siguiente ?page=1&per_page=100 siendo el primer parámetro el número de la página y el segundo el número de registros por página.

**CURL**

```text
curl -X GET \
https://BASE_URL/api/suclient/customers \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/suclient/customers', [
    'headers' => [
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/suclient/customers', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request(data);
```

**Respuestas**

*200*

```json
[
  {
    "Customers": [
      {
        "last_4_digits": "XXXXXXXXXXXX6622",
        "identifier": "surec804a8ed60c747cb8839",
        "card_type": "Visa",
        "register": "2023-07-26 08:00:19"
      },
      {
        "last_4_digits": "XXXXXXXXXXXX1234",
        "identifier": "surec804a8ed60c747cb8843",
        "card_type": "MasterCard",
        "register": "2023-01-01 12:00:00",
        "additional_parameters": {
          "type": "array",
          "description": "Parámetros adicionales que puede enviar payku.",
          "example": ""
        },
        "subcriptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "description": "Identificador de la suscripción creado por payku.",
                "type": "string",
                "example": "su867f07772aa5f5175527"
              },
              "created_at": {
                "description": "Fecha de registro.",
                "type": "string",
                "example": "2023-09-29 19:58:35",
                "format": "datetime"
              },
              "status": {
                "description": "Estatus de la suscripción. Los posibles estados que puede obtener son los siguientes:\n- register\n- active\n- finish\n- delete\n- cancel\n- suspended\n",
                "type": "string",
                "example": "active"
              },
              "amount": {
                "description": "Monto de la suscripción.",
                "type": "string",
                "example": "15000"
              },
              "plan": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "description": "Identificador del plan creado por payku.",
                      "type": "string",
                      "example": "pl9697fb170834ad42dd00"
                    },
                    "name": {
                      "description": "Nombre del plan.",
                      "type": "string",
                      "example": "test plan"
                    },
                    "currency": {
                      "description": "Moneda.",
                      "type": "string",
                      "example": "CLP"
                    }
                  }
                }
              },
              "cards": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "last_4_digits": {
                      "description": "Últimos 4 dígitos de la tarjeta afiliada.",
                      "type": "string",
                      "example": "XXXXXXXXXXXX6623"
                    },
                    "card_type": {
                      "description": "Tipo de tarjeta.",
                      "type": "string",
                      "example": "Visa"
                    }
                  }
                }
              },
              "transactions": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "created_at": {
                      "description": "Fecha de creación de la transacción.",
                      "type": "string",
                      "example": "2023-09-30 19:58:35"
                    },
                    "date_payment": {
                      "description": "Fecha en que se realizo la transacción.",
                      "type": "string",
                      "example": "2023-09-30"
                    },
                    "amount": {
                      "description": "Monto de transacción.",
                      "type": "int",
                      "example": 10000
                    },
                    "transaction": {
                      "description": "Número de transacción.",
                      "type": "int",
                      "example": 204444
                    },
                    "authorization_code": {
                      "description": "Código de autorización.",
                      "type": "string",
                      "example": "1234"
                    },
                    "order": {
                      "description": "Número de orden.",
                      "type": "string",
                      "example": "001"
                    },
                    "description": {
                      "description": "Descripción.",
                      "type": "string",
                      "example": "descripcion"
                    },
                    "status": {
                      "description": "Estatus de transacción.Los posibles estados que puede obtener son los siguientes:\n- pending\n- success\n- retry\n- canceled by customer\n- canceled by paymaster\n- canceled by payku\n- maximum attempt limit\n- first payment rejected\n- payment consumes failed\n",
                      "type": "string",
                      "example": "success"
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]
  }
]
```

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Crear suscripción

`POST /api/sususcription`

Este método permite al usuario de una cuenta payku crear una suscripción a un plan de suscripción de monto fijo, suscripción de plan de consumo y suscripción de monto variable a uno de sus clientes, para este ultimo tipo de suscripción es necesario enviar el monto que sera cobrado en la suscripción, es importante destacar que al realizar esta solicitud por primera vez se realizará un cobro de $50 que permite comprobar que la tarjeta se encuentra activa y es válida, en el caso de un plan de suscripción fijo el cobro del servicio será automático a partir del mes siguiente de la fecha de suscripción y en el caso que la suscripción sea a un plan de consumo será necesario utilizar el endpoint api/sutransaction para generar la transacción.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `plan` | string | ✓ | Id del plan. — máximo 70 caracteres — Ejemplo: `pl9697fb170834ad42dd00` |
| `client` | string | ✓ | Id del cliente. — máximo 20 caracteres — Ejemplo: `cl9b1e1dd988694f30fa30` |
| `amount` *(oneOf · opción 1)* | string | ✓ | Este campo solo sera usado en caso de planes de suscripciones de monto variable, es importante destacar que la moneda a utilizar en este tipo de plan es CLP. — máximo 14 dígitos |
| `coupon` *(oneOf · opción 2)* | string | ✓ | Código del cupón — máximo 50 caracteres |

**CURL**

```text
curl -X POST \
https://BASE_URL/api/sususcription \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "plan": "pl9697fb170834ad42dd00",
    "client": "cl9b1e1dd988694f30fa30"
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/sususcription, [
    'json' => [
      'plan' => 'pl9697fb170834ad42dd00',
      'client' => 'cl9b1e1dd988694f30fa30',
      ],
      'headers' => [
        'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
        'Authorization' => 'Bearer TOKEN_PUBLICO'
      ]
    ])->getBody();
  $response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/sususcription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  plan: "pl9697fb170834ad42dd00",
  client: "cl9b1e1dd988694f30fa30",
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "register",
  "id": "sucaab7865dceaff49d8b3",
  "url": "http://BASE_URL/gateway/registrosuscripcion?tipoplan=2&plan=true&token=219&validacion=e6c50ba0e0"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus. — Ejemplo: `register` |
| `id` | string |  | Identificador único de suscripción por payku. — Ejemplo: `sucaab7865dceaff49d8b3` |
| `url` | string |  | Url pago y activación de suscripción. — Ejemplo: `http://BASE_URL/gateway/registrosuscripcion?tipoplan=2&plan=true&token=219&validacion=e6c50ba0e0` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener suscripciones

`GET /api/sususcription`

Este método permite obtener todos las suscripciones asociados a un ID de usuario , este método permite una paginación con un máximo de  registros por página, además, posee un filtro de fecha, si este parámetro no es ingresado se tomará la fecha actual, para la paginación es necesario agregar al final del endpoint lo siguiente ?page=1&per_page=100 siendo el primer parámetro el número de la página y el segundo el número de registros por página. estatus: se puede filtrar la búsqueda de las suscripciones dependiendo del estatus que se desea buscar agregando el estatus a buscar igual a true, en caso de no agregar ninguno por defecto se buscaran todas las suscripciones sin discriminar por su estatus.

**CURL**

```text
curl -X GET \
https://BASE_URL/api/sususcription \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/sususcription', [
    'headers' => [
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/sususcription', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request(data);
```

**Respuestas**

*200*

```json
[
  {
    "subscriptions": [
      {
        "id": "sucaab7865dceaff49d8b7",
        "status": "active",
        "last_status_current_payment": "pending",
        "start": "2019-07-22 18:34:49",
        "end": "2023-06-12 00:00:00",
        "client": {
          "id": "su7e5e1c0b1bd2e37ec557",
          "name": "name",
          "email": "johndoe@example.com",
          "rut": "11.111.111-1",
          "phone": "56928265454",
          "parámetros": [],
          "additional_parameters": ""
        },
        "plan": {
          "id": "pl9697fb170834ad42dd00",
          "name": "test plan",
          "currency": "CLP"
        },
        "cards": {
          "last_4_digits": "XXXXXXXXXXXX6622",
          "card_type": "Visa"
        },
        "transactions": [
          {
            "created_at": "2023-09-30 19:58:35",
            "amount": 10000,
            "transaction": 204444,
            "authorization_code": "1234",
            "order": "001",
            "description": "descripcion",
            "status": "success"
          }
        ],
        "logs": {
          "status": [
            {
              "change_date": null,
              "initial_status": null,
              "final_status": null
            }
          ]
        }
      }
    ]
  }
]
```

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener suscripciones V3

`GET /api/sususcriptionv3`

Este método permite obtener todos las suscripciones asociados a un ID de usuario , este método permite una paginación con un máximo de 4000 registros por página, además, posee los siguientes filtros:

date_init: indica la fecha desde donde se desea comenzar la búsqueda de suscripciones, si este parámetro no es enviado la busqueda iniciara la fecha actual .
date_end: indica la fecha donde se desea que termine la búsqueda de suscripciones, si este parámetro no es enviado la busque tendrá como fecha final la fecha actual.
estatus: se puede filtrar la búsqueda de las suscripciones dependiendo del estatus que se desea buscar agregando el estatus a buscar igual a true, en caso de no agregar ninguno por defecto se buscaran todas las suscripciones sin discriminar por su estatus.

para la paginación es necesario agregar al final del endpoint lo siguiente ?page=1&per_page=100 siendo el primer parámetro el número de la página y el segundo el número de registros por página. En caso de querer buscar las suscripciones entre las fechas 01-09-2021 y 15-09-2021, además que solo sean las suscripciones de estado active, la url a utilizar seria la siguiente: https://[URL_BASE]/api/sususcriptionv3?date_init=2021-09-01&date_end=2021-09-15&active=true.

**CURL**

```text
curl -X GET \
https://BASE_URL/api/sususcriptionv3 \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/sususcriptionv3', [
    'headers' => [
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/sususcriptionv3', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request(data);
```

**Respuestas**

*200*

```json
[
  {
    "subscriptions": [
      {
        "id": "sucaab7865dceaff49d8b7",
        "estatus": "active",
        "start": "2019-07-22 18:34:49",
        "end": "2023-06-12 00:00:00",
        "client": {
          "id": "su7e5e1c0b1bd2e37ec557",
          "name": "name",
          "email": "johndoe@example.com",
          "rut": "11.111.111-1",
          "phone": "56928265454",
          "parámetros": [],
          "additional_parameters": ""
        },
        "plan": {
          "id": "pl9697fb170834ad42dd00",
          "name": "test plan",
          "currency": "CLP"
        },
        "active_cards": {
          "last_4_digits": "XXXXXXXXXXXX6622",
          "card_type": "Visa"
        },
        "logs": {
          "status": [
            {
              "change_date": null,
              "initial_status": null,
              "final_status": null
            }
          ]
        },
        "paid": [
          {
            "payment_cycle_day": "2021-07-09",
            "payment_day": "2021-07-09",
            "status": "success",
            "amount_paid": 2500,
            "try_number": 1,
            "paid_number": 1,
            "transactions": []
          }
        ]
      }
    ]
  }
]
```

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Crear transacción

`POST /api/sutransaction`

Este método permite al usuario de una cuenta payku generar una transacción única a uno de sus clientes que encuentre suscrito a un plan de consumo.
<br>
<div class='container'>
  <img src='https://docs.payku.com/img/diagrams/Diagrama-Sutransaction.png' alt='Avatar' class='image' style='width:100%'>
  <div class='middle'>
    <a target='_blank' href='https://docs.payku.com/img/diagrams/Diagrama-Sutransaction.png' class='text'>Ver diagrama</a>
  </div>
</div>

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `suscription` | string | ✓ | Identificador único de suscripción por payku. — máximo 60 caracteres — Ejemplo: `sucaab7865dceaff49d8b3` |
| `amount` | string |  | Monto. — máximo 14 caracteres — Ejemplo: `10000` |
| `order` | string |  | Orden. — máximo 40 caracteres — Ejemplo: `001` |
| `description` | string |  | Descripción. — máximo 1000 caracteres — Ejemplo: `Descripción` |

**CURL**

```text
curl -X POST \
https://BASE_URL/api/sutransaction \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "suscription": "sucaab7865dceaff49d8b3",
    "amount": "10000",
    "order": "001",
    "description": "Descripción"
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/sutransaction, [
    'json' => [
      'suscription' => sucaab7865dceaff49d8b3,
      'order' => '001',
      'amount' => '10000',
      'description' => 'descripcion'
      ],
      'headers' => [
        'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
        'Authorization' => 'Bearer TOKEN_PUBLICO'
      ]
    ])->getBody();
  $response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/sutransaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  suscription: "sucaab7865dceaff49d8b3",
  amount: "10000",
  order: "001",
  description: "Descripción"
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "order": "001",
  "amount": "10000",
  "transaction_id": "204444",
  "verification_key": "025dcad37e071daa8bfc2df35189009db65692a4ff766856108be1675e870839"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - rejected - refunded partial - refunded — Ejemplo: `success` |
| `order` | string |  | Orden. — Ejemplo: `001` |
| `amount` | string |  | Monto. — Ejemplo: `10000` |
| `transaction_id` | string |  | Número de transacción. — Ejemplo: `204444` |
| `verification_key` | string |  | Ejemplo: `025dcad37e071daa8bfc2df35189009db65692a4ff766856108be1675e870839` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener suscripción

`GET /api/sususcription/{identificadorSuscripcion}`

Este método permite obtener el detalle de una suscripción.

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | Identificador único de transacción por payku. — máximo 20 caracteres |

**CURL**

```text
curl -X GET \
https://BASE_URL/api/sususcription/id \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/sususcription/sucaab7865dceaff49d8b', [
    'headers' => [
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/sususcription/sucaab7865dceaff49d8b', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request(data);
```

**Respuestas**

*200*

```json
{
  "id": "sucaab7865dceaff49d8b7",
  "status": "active",
  "start": "2019-07-22 18:34:49",
  "end": "2023-06-12 00:00:00",
  "client": {
    "id": "cld0835b9063a5903f4ae7",
    "name": "name",
    "email": "joedoe@example.com",
    "rut": "11.111.111-1",
    "phone": "56972756487",
    "parámetros": [],
    "additional_parameters": ""
  },
  "plan": {
    "id": "pl9697fb170834ad42dd00",
    "name": "test plan",
    "currency": "CLP"
  },
  "cards": {
    "last_4_digits": "XXXXXXXXXXXX6622",
    "card_type": "Visa"
  },
  "active_cards": [
    {
      "last_4_digits": "XXXXXXXXXXXX6622",
      "identifier": "surec804a8ed60c747cb8839",
      "card_type": "Visa",
      "register": "2023-07-26 08:00:19"
    },
    {
      "last_4_digits": "XXXXXXXXXXXX1234",
      "identifier": "surec804a8ed60c747cb8843",
      "card_type": "MasterCard",
      "register": "2023-01-01 12:00:00"
    }
  ],
  "transactions": [
    {
      "created_at": "2023-09-30 19:58:35",
      "amount": 10000,
      "transaction": 204444,
      "authorization_code": "1234",
      "order": "001",
      "description": "descripcion",
      "status": "success"
    }
  ],
  "logs": {
    "status": [
      {
        "change_date": "2021-02-17 16:11:53",
        "initial_status": "register",
        "final_status": "active"
      }
    ]
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string |  | Identificador de la suscripción creado por payku. — Ejemplo: `sucaab7865dceaff49d8b7` |
| `status` | string |  | Estatus de la suscripción. Los posibles estados que puede obtener son los siguientes: - register - active - finish - delete - cancel - suspended — Ejemplo: `active` |
| `start` | string |  | Fecha de inicio de la suscripción. — Ejemplo: `2019-07-22 18:34:49` |
| `end` | string |  | Fecha de termino de la suscripción. — Ejemplo: `2023-06-12 00:00:00` |
| `client` | object |  |  |
| ↳ `id` | string |  | Identificador del cliente creado por payku. — Ejemplo: `cld0835b9063a5903f4ae7` |
| ↳ `name` | string |  | Nombre del cliente. — Ejemplo: `name` |
| ↳ `email` | string |  | Email del cliente. — Ejemplo: `joedoe@example.com` |
| ↳ `rut` | string |  | Rol único Tributario. — Ejemplo: `11.111.111-1` |
| ↳ `phone` | string |  | Teléfono del cliente. — Ejemplo: `56972756487` |
| ↳ `parámetros` | array of anys |  |  |
| ↳ `additional_parameters` | array of anys |  | Parámetros adicionales que puede enviar payku. — Ejemplo: `` |
| `plan` | object |  |  |
| ↳ `id` | string |  | Identificador del plan creado por payku. — Ejemplo: `pl9697fb170834ad42dd00` |
| ↳ `name` | string |  | Nombre del plan. — Ejemplo: `test plan` |
| ↳ `currency` | string |  | Moneda. — Ejemplo: `CLP` |
| `cards` | object |  |  |
| ↳ `last_4_digits` | string |  | Últimos 4 dígitos de la tarjeta afiliada. — Ejemplo: `XXXXXXXXXXXX6622` |
| ↳ `card_type` | string |  | Tipo de tarjeta. — Ejemplo: `Visa` |
| `active_cards` | array of objects |  | Ejemplo: `[{"last_4_digits":"XXXXXXXXXXXX6622","identifier":"surec804a8ed60c747cb8839","card_type":"Visa","register":"2023-07-26 08:00:19"},{"last_4_digits":"XXXXXXXXXXXX1234","identifier":"surec804a8ed60c747cb8843","card_type":"MasterCard","register":"2023-01-01 12:00:00"}]` |
| ↳ `last_4_digits` | string |  | Últimos 4 dígitos de la tarjeta afiliada. — Ejemplo: `XXXXXXXXXXXX6622` |
| ↳ `identifier` | string |  | identificador de la tarjeta. — Ejemplo: `surec804a8ed60c747cb8839` |
| ↳ `card_type` | string |  | Tipo de tarjeta. — Ejemplo: `Visa` |
| ↳ `register` | string |  | Fecha de registro. — Ejemplo: `2023-07-26 08:00:19` |
| `transactions` | array of objects |  |  |
| ↳ `created_at` | string |  | Fecha de creación de la transacción. — Ejemplo: `2023-09-30 19:58:35` |
| ↳ `amount` | int |  | Monto de transacción. — Ejemplo: `10000` |
| ↳ `transaction` | int |  | Número de transacción. — Ejemplo: `204444` |
| ↳ `authorization_code` | string |  | Código de autorización. — Ejemplo: `1234` |
| ↳ `order` | string |  | Número de orden. — Ejemplo: `001` |
| ↳ `description` | string |  | Descripción. — Ejemplo: `descripcion` |
| ↳ `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - rejected - refunded partial - refunded — Ejemplo: `success` |
| `logs` | object |  | Objeto con registros de información sobre las suscripciones |
| ↳ `status` | array of objects |  | Arreglo que contiene los cambios de estatus que se realizaron en la suscripción |
| ↳ ↳ `change_date` | string |  | Fecha en que se realizo el cambio — Ejemplo: `2021-02-17 16:11:53` |
| ↳ ↳ `initial_status` | string |  | Estatus inicial de la suscripción — Ejemplo: `register` |
| ↳ ↳ `final_status` | string |  | Estatus final de la suscripción — Ejemplo: `active` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Eliminar suscripción

`DELETE /api/sususcription/{identificadorSuscripcion}`

Este método permite la eliminación de una suscripción asociada a un ID de suscripción.

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | Identificador único de suscripción creado por payku. — máximo 20 caracteres |

**CURL**

```text
curl -X DELETE \
https://BASE_URL/api/sususcription/id \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('DELETE', 'https://BASE_URL/api/sususcription/sucaab7865dceaff49d8b3, [
      'headers' => [
        'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
        'Authorization' => 'Bearer TOKEN_PUBLICO'              ]
      ])->getBody();
    $response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/sususcription/sucaab7865dceaff49d8b', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request(data);
```

**Respuestas**

*200*

```json
{
  "id": "sucaab7865dceaff49d8b3",
  "status": "success"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `sucaab7865dceaff49d8b3` |
| `status` | string |  | Estatus. — Ejemplo: `success` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Afiliar tarjeta

`POST /api/suinscriptionscards`

Este método permite la Inserción de los datos de una tarjeta para suscripción.

**Improtante**

En caso de necesitar de la renovacion de tarjeta de su cliente, el método le permitira agregar una nueva tarjeta a la suscripcion.

**¡Inmediatamente a la actualización de la tarjeta asociada a la suscripción, el sistema podrá realizar los cargos atrasados correspondientes según configuración del plan suscrito!**,
Es decir, si la suscripción se encuentra en estatus suspendido por máximos intentos de cobros realizados, y el cliente registra una nueva tarjeta, el sistema podrá revisar los pagos pendientes, hacer el cargo correspondiente, y activar automáticamente la suscripción

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `suscription` | string | ✓ | ID de suscripción. — máximo 60 caracteres — Ejemplo: `sucaab7865dceaff49d8b3` |

**CURL**

```text
curl -X POST \
https://BASE_URL/api/suinscriptionscards \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "suscription": "sucaab7865dceaff49d8b3"
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/suinscriptionscards', [
    'json' => [
      'suscription' => sucaab7865dceaff49d8b3,
      ],
      'headers' => [
        'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
        'Authorization' => 'Bearer TOKEN_PUBLICO'              ]
      ])->getBody();
    $response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/suinscriptionscards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  suscription: "sucaab7865dceaff49d8b3"
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "id": "sucaab7865dceaff49d8b3",
  "url": "https://BASE_URL/gateway/registrosuscripcion?plan=true&token=246&validacion=d6b32"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus. — Ejemplo: `success` |
| `id` | string |  | Identificador único de suscripción por payku. — Ejemplo: `sucaab7865dceaff49d8b3` |
| `url` | string |  | URL pago y activación de suscripción. — Ejemplo: `https://BASE_URL/gateway/registrosuscripcion?plan=true&token=246&validacion=d6b32` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Eliminar tarjeta

`POST /api/suscriptionsdeletecards`

Este método permite eliminar una tarjeta asociada a la suscripción.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `suscription` | string | ✓ | ID de la tarjeta asociada. — máximo 60 caracteres — Ejemplo: `surec804a8ed60c0a8cb8839` |

**CURL**

```text
curl -X POST \
https://BASE_URL/api/suscriptionsdeletecards \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "card": "surec804a8ed60c0a8cb8839"
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/suscriptionsdeletecards', [
    'json' => [
      'card' => surec804a8ed60c0a8cb8839,
      ],
      'headers' => [
        'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
        'Authorization' => 'Bearer TOKEN_PUBLICO'              ]
      ])->getBody();
    $response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/suscriptionsdeletecards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  card: "surec804a8ed60c0a8cb8839"
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "Delete",
  "card": "surec804a8ed60c0a8cb8839"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Status. — Ejemplo: `Delete` |
| `card` | string |  | Identificador único de La tarjeta asociada a la suscripción. — Ejemplo: `surec804a8ed60c0a8cb8839` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "card",
  "message_error": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `card` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `is not valid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener plan

`GET /api/suplan/{identificadorPlan}`

Este método permite obtener el detalle de un plan.

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | Identificador único de plan por payku. — máximo 20 caracteres |

**CURL**

```text
curl -X GET \
https://BASE_URL/api/suplan/id \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/suplan/pl29f6ad69fbd594148c39', [
    'headers' => [
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/suplan/pl29f6ad69fbd594148c39', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "plans": {
    "id": "pl4293e97a87195bb9edcd",
    "status": "active",
    "name": "Test plan",
    "code": "001",
    "description": "Test Plan",
    "url_notify_payment": "",
    "url_notify_suscription": "",
    "total_suscription": 0,
    "total_suscription_active": 0
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus. — Ejemplo: `success` |
| `plans` | object |  |  |
| ↳ `id` | string |  | Identificador único de plan por payku. — Ejemplo: `pl4293e97a87195bb9edcd` |
| ↳ `status` | string |  | Estatus del plan. — Ejemplo: `active` |
| ↳ `name` | string |  | Nombre del plan. — Ejemplo: `Test plan` |
| ↳ `code` | string |  | Código del plan. — Ejemplo: `001` |
| ↳ `description` | string |  | Descripción del plan. — Ejemplo: `Test Plan` |
| ↳ `url_notify_payment` | string |  | Ejemplo: `` |
| ↳ `url_notify_suscription` | string |  | Ejemplo: `` |
| ↳ `total_suscription` | integer |  | Total de suscripciones. — Ejemplo: `0` |
| ↳ `total_suscription_active` | integer |  | Total de suscripciones activas. — Ejemplo: `0` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener planes

`GET /api/suplan/plans`

Este método permite obtener el detalle de todos los planes.

**CURL**

```text
curl -X GET \
https://BASE_URL/api/suplan/plans \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/suplan/plans', [
    'headers' => [
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/suplan/plans', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "plans": [
    {
      "id": "pl4293e97a87195bb9edcd",
      "status": "active",
      "name": "Test plan",
      "code": "001",
      "description": "Test Plan",
      "url_notify_payment": "",
      "url_notify_suscription": "",
      "total_suscription": 0,
      "total_suscription_active": 0
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus. — Ejemplo: `success` |
| `plans` | array of objects |  |  |
| ↳ `id` | string |  | Identificador único de plan por payku. — Ejemplo: `pl4293e97a87195bb9edcd` |
| ↳ `status` | string |  | Estatus del plan. — Ejemplo: `active` |
| ↳ `name` | string |  | Nombre del plan. — Ejemplo: `Test plan` |
| ↳ `code` | string |  | Código del plan. — Ejemplo: `001` |
| ↳ `description` | string |  | Descripción del plan. — Ejemplo: `Test Plan` |
| ↳ `url_notify_payment` | string |  | Ejemplo: `` |
| ↳ `url_notify_suscription` | string |  | Ejemplo: `` |
| ↳ `total_suscription` | integer |  | Total de suscripciones. — Ejemplo: `0` |
| ↳ `total_suscription_active` | integer |  | Total de suscripciones. — Ejemplo: `0` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### url Callback notificación suscripción

`POST /urlnotifysuscription`

Luego de realizar la activación de la suscripción por parte del usuario, payku notificara al comercio, el resultado de la operación (status), realizando una solicitud post a la url de notificación de suscripción suministrada previamente en la creación de la suscripción y a su vez entregará una serie de datos para las validaciones internas por parte de la aplicación del comercio, el id de la suscripción el cual corresponde al identificador único en payku. Estos datos permitirán al comercio conocer el estado de sus suscripciones y respaldarlas en su base de datos.

**Respuestas**

*200*

```json
{
  "id": "su74866857980c7d2b4306",
  "status": "active"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string |  | Identificador de la suscripción creado por payku. — Ejemplo: `su74866857980c7d2b4306` |
| `status` | string |  | Estatus de la suscripción. Los posibles estados que puede obtener son los siguientes: - register - active - finish - delete - cancel - suspended — Ejemplo: `active` |

### url Callback notificación cobro

`POST /urlnotifypayment`

Luego de realizado el cobro de la suscripción de forma automatica, payku notificara al comercio, el resultado de la operación (status), realizando una solicitud post a la url de notificación de cobro suministrada previamente en la creación de la suscripción y a su vez entregará una serie de datos para las validaciones internas por parte de la aplicación del comercio, el transactionn_id el cual corresponde al identificador único en payku y un verification_key, que corresponde a un hash de validación único por transacción. Estos datos permitirán al comercio conocer el estado de sus transaciones y respaldarlas en su base de datos.

**Respuestas**

*200*

```json
{
  "transaction_id": 9123123,
  "verification_key": "2ba83615f863e72sdca5dfd0a6df2782",
  "order": 1568041684,
  "status": "success",
  "subscriptions": {
    "id": "su3ce571420e90b600eafb",
    "client": "cl795704ece0a3690baaf"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `transaction_id` | number |  | Identificador único de transacción por payku. — Ejemplo: `9123123` |
| `verification_key` | string |  | Hash único de transacción. — Ejemplo: `2ba83615f863e72sdca5dfd0a6df2782` |
| `order` | string |  | Identificador único de transacción enviado por el comercio. — Ejemplo: `1568041684` |
| `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - rejected - refunded partial - refunded — Ejemplo: `success` |
| `subscriptions` | object |  | Contiene los id de la suscripción y el cliente suscrito |
| ↳ `id` | string |  | Identificador único de suscripción por payku. — Ejemplo: `su3ce571420e90b600eafb` |
| ↳ `client` | string |  | Identificador único del cliente por payku — Ejemplo: `cl795704ece0a3690baaf` |

## Suscripción de consumo

Es el conjunto de métodos que permitirán a nuestros usuarios la creación de clientes, planes, suscripciones y realizar transacciones de planes de consumo.

El principal uso de estos métodos es para realizar cargos únicos a un cliente por un servicio o producto, como por el ejemplo la contratación de un servicio de delivery de algún producto o la compra de un producto en particular.

Si se desea que el cliente vaya directo a la pasarela de pago de webpay es necesario enviar a través de parámetros en la url, en caso de una suscripción con los parámetros básicos como son nombre, apellido, email y teléfono, la url tendría la siguiente forma:
https://BASE_URL/suscripcion/index?idplan=607&verif=b4280f5e&nombre=vicente&apellido=borjas&email=example@ example.com&telefono=986523565&direct_full=true

Si se desean agregar otros parámetros estos deben ser concatenados a través de & continuando con la estructura antes mostrada.

### Crear cliente

`POST /api/suclient/`

Este método permite la creación de un cliente.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | string | ✓ | Email del cliente. — máximo 50 caracteres — Ejemplo: `johndoe@example.com` |
| `name` | string | ✓ | Nombre del cliente. — máximo 80 caracteres — Ejemplo: `John Doe` |
| `rut` | integer |  | Registro Único Tributario del cliente, será permitido el ingreso de este dato con ó sin guión. — 12 caracteres requeridos — Ejemplo: `11111111` |
| `phone` | string | ✓ | Teléfono del cliente. — 20 caracteres requeridos — Ejemplo: `923122312` |
| `address` | string |  | Dirección del cliente. — máximo 200 caracteres — Ejemplo: `Moneda 101` |
| `country` | string |  | País del cliente. — máximo 40 caracteres — Ejemplo: `Chile` |
| `region` | string |  | Región del cliente. — máximo 120 caracteres — Ejemplo: `Metropolitana` |
| `city` | string |  | Ciudad del cliente. — máximo 40 caracteres — Ejemplo: `Santiago` |
| `postal_code` | string |  | Código postal del cliente. — máximo 10 caracteres — Ejemplo: `850000` |
| `additional_parameters` | object |  | Parámetros adicionales del cliente (Opcional). — máximo 4000 caracteres |
| ↳ `parameter_1` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |
| ↳ `parameter_2` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |

**CURL**

```text
curl -X POST \
https://BASE_URL/api/suclient \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "email": "johndoe@example.com",
    "name": "John Doe",
    "rut": "111111111",
    "phone": "923122312",
    "address": "Moneda 101",
    "country": "Chile",
    "region": "Metropolitana",
    "city": "Santiago",
    "postal_code": "850000,
    "additional_parameters":{
      "parameter_1": "example",
      "parameter_2": "example 2",
    }
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/suclient', [
    'json' => [
      'email' => 'johndoe@example.com',
      'name' => 'John Doe',
      'rut' => '111111111',
      'phone' => '923122312',
      'address' => 'Moneda 101',
      'country' => 'Chile',
      'region' => 'Metropolitana',
      'city' => 'Santiago',
      'postal_code' => '850000',
        'additional_parameters' => [
          'parameter_1' => 'example',
          'parameter_2' => 'example 2'
        ]
      ],
    'headers' => [
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/suclient', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  email: "johndoe@example.com",
  name: "John Doe",
  rut: "111111111",
  phone: "923122312",
  address: "Moneda 101",
  country: "Chile",
  region: "Metropolitana",
  city: "Santiago",
  postal_code: "850000",
  additional_parameters:{
    parameter_1: "example",
    parameter_2: "example 2",
  }
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "active",
  "id": "cl0be4c8e623c167bc8b777",
  "rut": "11111111",
  "name": "John Doe",
  "phone": "923122312",
  "email": "johndoe@example.com",
  "address": "Moneda 101",
  "country": "Chile",
  "region": "Metropolitana",
  "city": "Santiago",
  "postal_code": "850000",
  "created_at": "2023-09-29",
  "update_at": null,
  "subcriptions": null,
  "additional_parameters": {
    "parameter_1": "example",
    "parameter_2": "example"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus del cliente. — Ejemplo: `active` |
| `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `cl0be4c8e623c167bc8b777` |
| `rut` | string |  | Registro Único Tributario del cliente. — Ejemplo: `11111111` |
| `name` | string |  | Nombre del cliente. — Ejemplo: `John Doe` |
| `phone` | string |  | Teléfono del cliente. — Ejemplo: `923122312` |
| `email` | string |  | Email del cliente. — Ejemplo: `johndoe@example.com` |
| `address` | string |  | Dirección del cliente. — Ejemplo: `Moneda 101` |
| `country` | string |  | País del cliente. — Ejemplo: `Chile` |
| `region` | string |  | Región del cliente. — Ejemplo: `Metropolitana` |
| `city` | string |  | Ciudad del cliente. — Ejemplo: `Santiago` |
| `postal_code` | string |  | Código postal del cliente. — Ejemplo: `850000` |
| `created_at` | string |  | Fecha de registro. — Ejemplo: `2023-09-29` |
| `update_at` | string |  | Fecha de modificación. |
| `subcriptions` | object |  | suscripciones del cliente. |
| `additional_parameters` | object |  | Parámetros adicionales del cliente (Opcional). |
| ↳ `parameter_1` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |
| ↳ `parameter_2` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `example` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Crear plan

`POST /api/suplan/`

Este método permite la Inserción de los datos para la creación de un plan.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `name` | string | ✓ | Nombre del plan. — máximo 20 caracteres — Ejemplo: `Test plan` |
| `description` | string |  | Descripción del plan. — máximo 1000 caracteres — Ejemplo: `Test Plan` |
| `url_notify_suscription` | string |  | URL donde se notificare el estado de la suscripcion. — máximo 240 caracteres — Ejemplo: `https://youwebsite.com/urlnotifysuscription` |
| `url_notify_payment` | string |  | URL donde se notificare el estado del pago. — máximo 240 caracteres — Ejemplo: `https://youwebsite.com/urlnotifypayment` |
| `url_success_payment` | string |  | URL donde se redigira al usuario si el pago es exitoso. — máximo 240 caracteres — Ejemplo: `https://youwebsite.com/urlsuccesspayment` |
| `url_failed_payment` | string |  | URL donde se redigira al usuario si el pago es fallido. — máximo 240 caracteres — Ejemplo: `https://youwebsite.com/urlfailedpayment` |

**CURL**

```text
curl -X POST \
https://BASE_URL/api/suplan \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "name": "Test plan",
    "description": "Test Plan"
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/suplan', [
    'json' => [
      'name' => 'Test plan',
      'description' => 'Test Plan'
      ],
      'headers' => [
        'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
        'Authorization' => 'Bearer TOKEN_PUBLICO'              ]
      ])->getBody();
    $response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/suplan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  name: "Test plan",
  description: "Test Plan"
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "id": "pl4293e97a87195bb9edcd"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus. — Ejemplo: `success` |
| `id` | string |  | Identificador único de plan por payku. — Ejemplo: `pl4293e97a87195bb9edcd` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Crear suscripción

`POST /api/sususcription/`

Este método permite al usuario de una cuenta payku crear una suscripción a un plan de suscripción de monto fijo, suscripción de plan de consumo y suscripción de monto variable a uno de sus clientes, para este ultimo tipo de suscripción es necesario enviar el monto que sera cobrado en la suscripción, es importante destacar que al realizar esta solicitud por primera vez se realizará un cobro de $50 que permite comprobar que la tarjeta se encuentra activa y es válida, en el caso de un plan de suscripción fijo el cobro del servicio será automático a partir del mes siguiente de la fecha de suscripción y en el caso que la suscripción sea a un plan de consumo será necesario utilizar el endpoint api/sutransaction para generar la transacción.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `plan` | string | ✓ | Id del plan. — máximo 70 caracteres — Ejemplo: `pl9697fb170834ad42dd00` |
| `client` | string | ✓ | Id del cliente. — máximo 20 caracteres — Ejemplo: `cl9b1e1dd988694f30fa30` |

**CURL**

```text
curl -X POST \
https://BASE_URL/api/sususcription \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "plan": "pl9697fb170834ad42dd00",
    "client": "cl9b1e1dd988694f30fa30"
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/sususcription, [
    'json' => [
      'plan' => 'pl9697fb170834ad42dd00',
      'client' => 'cl9b1e1dd988694f30fa30',
      ],
      'headers' => [
        'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
        'Authorization' => 'Bearer TOKEN_PUBLICO'
      ]
    ])->getBody();
  $response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/sususcription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  plan: "pl9697fb170834ad42dd00",
  client: "cl9b1e1dd988694f30fa30"
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "register",
  "id": "sucaab7865dceaff49d8b3",
  "url": "http://BASE_URL/gateway/registrosuscripcion?tipoplan=2&plan=true&token=219&validacion=e6c50ba0e0"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus. — Ejemplo: `register` |
| `id` | string |  | Identificador único de suscripción por payku. — Ejemplo: `sucaab7865dceaff49d8b3` |
| `url` | string |  | Url pago y activación de suscripción. — Ejemplo: `http://BASE_URL/gateway/registrosuscripcion?tipoplan=2&plan=true&token=219&validacion=e6c50ba0e0` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Crear transacción

`POST /api/sutransaction/`

Este método permite al usuario de una cuenta payku crear una transacción única a uno de sus clientes que encuentre suscrito a un plan de consumo.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `suscription` | string | ✓ | Identificador único de suscripción por payku. — máximo 60 caracteres — Ejemplo: `sucaab7865dceaff49d8b3` |
| `amount` | string |  | Monto. — máximo 14 dígitos — Ejemplo: `10000` |
| `order` | string |  | Orden. — máximo 40 caracteres — Ejemplo: `001` |
| `description` | string |  | Descripción. — máximo 1000 caracteres — Ejemplo: `Descripción` |
| `marketplace` | string |  | ma0690b6451a7043d5. — 20 caracteres — Ejemplo: `ma0690b6451a7043d5` |
| `card` | string |  | Con el identificador puede indicar a cual de las tarjetas activas se realizará el cobro (OPCIONAL). — máximo 28 caracteres — Ejemplo: `surea041d8a4413949425fec` |

**CURL**

```text
curl -X POST \
https://BASE_URL/api/sutransaction \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "suscription": "sucaab7865dceaff49d8b3",
    "amount": "10000",
    "order": "001",
    "description": "Descripción",
    "marketplace": "ma0690b6451a7043d5"
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/sutransaction, [
    'json' => [
      'suscription' => sucaab7865dceaff49d8b3,
      'order' => '001',
      'monto' => '10000',
      'description' => 'descripcion',
      'marketplace' => "ma0690b6451a7043d5"
      ],
      'headers' => [
        'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
        'Authorization' => 'Bearer TOKEN_PUBLICO'
      ]
    ])->getBody();
  $response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/sutransaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  suscription: "sucaab7865dceaff49d8b3",
  amount: "10000",
  order: "001",
  description: "Descripción",
  marketplace: "ma0690b6451a7043d5"
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "order": "001",
  "amount": "10000",
  "transaction_id": "204444",
  "verification_key": "025dcad37e071daa8bfc2df35189009db65692a4ff766856108be1675e870839"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - rejected - refunded partial - refunded — Ejemplo: `success` |
| `order` | string |  | Orden. — Ejemplo: `001` |
| `amount` | string |  | Monto. — Ejemplo: `10000` |
| `transaction_id` | string |  | Número de transacción. — Ejemplo: `204444` |
| `verification_key` | string |  | Ejemplo: `025dcad37e071daa8bfc2df35189009db65692a4ff766856108be1675e870839` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Eliminar tarjeta

`POST /api/suscriptionsdeletecards/`

Este método permite eliminar una tarjeta asociada a la suscripción.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `suscription` | string | ✓ | ID de la tarjeta asociada. — máximo 60 caracteres — Ejemplo: `surec804a8ed60c0a8cb8839` |

**CURL**

```text
curl -X POST \
https://BASE_URL/api/suscriptionsdeletecards \
-H 'Accept: application/json, text/plain, */*' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Authorization: Bearer TOKEN_PUBLICO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE_URL' \
-d {
    "card": "surec804a8ed60c0a8cb8839"
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/suscriptionsdeletecards', [
    'json' => [
      'card' => surec804a8ed60c0a8cb8839,
      ],
      'headers' => [
        'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
        'Authorization' => 'Bearer TOKEN_PUBLICO'              ]
      ])->getBody();
    $response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/suscriptionsdeletecards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  card: "surec804a8ed60c0a8cb8839"
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "Delete",
  "card": "surec804a8ed60c0a8cb8839"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Status. — Ejemplo: `Delete` |
| `card` | string |  | Identificador único de La tarjeta asociada a la suscripción. — Ejemplo: `surec804a8ed60c0a8cb8839` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "card",
  "message_error": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `card` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `is not valid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

## Wallet

Permite generar transacciones bancarias desde tu billetera virtual **payku**.

### Realizar pagos a terceros desde mi wallet

`POST /api/wallet/payout`

Este método permite crear una orden de pago a un tercero utilizando los fondos de tu billetera virtual **payku**.

**Nota:** Para fines de prueba (Solo ambiente desarrollo), los montos específicos se procesarán automáticamente:
<br>
&bull;  Montos 1000, 2000, 3000: Se marcarán como **aprobados** automáticamente.
<br>
&bull;  Montos 1500, 2500, 3500: Se marcarán como **rechazados** automáticamente.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | string | ✓ | Email del usuario — máximo 50 caracteres — Ejemplo: `johndoe@example.com` |
| `phone` | string |  | Télefono del usuario — máximo 20 caracteres — Ejemplo: `923122312` |
| `subject` | string | ✓ | Descripción de la orden — máximo 200 caracteres — Ejemplo: `payOut description` |
| `currency` | string | ✓ | Tipo de moneda (Formato ISO) — máximo 6 caracteres — Ejemplo: `CLP` |
| `order` | string | ✓ | Orden del comercio — máximo 50 caracteres — Ejemplo: `98745` |
| `amount` | integer | ✓ | Monto de la orden — máximo 14 dígitos — Ejemplo: `25000` |
| `accountbank_name` | string | ✓ | Nombre del titular de la cuenta — máximo 180 caracteres — Ejemplo: `Jhon Doe` |
| `accountbank_rut` | string | ✓ | Documento de identidad del titular de la cuenta en Chile Formato: 111111111 — máximo 15 caracteres — Ejemplo: `111111111` |
| `accountbank_sbif` | string | ✓ | Código del banco al que pertenece la cuenta bancaria. — máximo 4 caracteres — Ejemplo: `0001` |
| `accountbank_type` | string | ✓ | Tipo de cuenta. - 1 Corriente - 2 Vista/Cuenta RUT - 3 Ahorro — máximo 1 caracterer — Ejemplo: `1` |
| `accountbank_num` | string | ✓ | Número de cuenta del cliente. - **Para el banco "banco estado" (sbif 0012) el máximo de caracteres es 12 Este banco es el más común en Chile, es bueno agregar la validación de máximo de dígitos de 12. Esto evita que los usuarios ingresen su número de tarjeta de débito Para el resto de los bancos, puede tener más de 12 caracteres ya que los bancos no están estandarizados en su formato de número de cuenta.** — máximo 200 caracteres — Ejemplo: `12312312312` |
| `url_notify` | string |  | url donde se notificare el resultado del pago. - Nota: Luego de realizar el pago a terceros payku respondera de forma automática al endpoint ingresado en urlnotify el resultado de la operación. - **Ejemplo Aprobado:** - { - "id": "morexzxxxx", - "identifier_payout": "morexzxxxx", - "order" : "367734544", - "status" : "success", - "update_at" : "2023-08-24 12:29:35", - "customer" : { - "name" : "Jhon Doe", - "phone" : "978456879", - "document" : "111111111", - "number" : "978456879" - } - } - **Ejemplo Rechazado:** - { - "id": "morexzxxxx", - "identifier_payout": "morexzxxxx", - "order" : "367734544", - "status" : "banking_error", - "update_at" : "2023-08-24 12:29:35", - "customer" : { - "name" : "Jhon Doe", - "phone" : "978456879", - "document" : "111111111", - "number" : "978456879" - } - } — máximo 600 caracteres — Ejemplo: `https://www.youwebsite.com/urlnotify?orderClient=98745` |
| `additional_parameters` | object |  | Parámetros adicionales del cliente (Opcional). — máximo 4000 caracteres |
| ↳ `parameter_1` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `keyValue` |
| ↳ `parameter_2` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `keyValue` |
| ↳ `order_ext` | string |  | Nombre de la orden externa dado por el usuario payku (Opcional) — Ejemplo: `fff-777` |

**cURL**

```bash
curl -X POST \
https://BASE-URL/api/wallet/payout \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
-d '{
  "email": "johndoe@example.com",
  "phone": "123456789",
  "subject": "PayOut 133222",
  "currency": "CLP",
  "order": "133222",
  "amount":  1000,
  "accountbank_name": "Jhon Doe",
  "accountbank_rut": "111111111",
  "accountbank_sbif": "0001",
  "accountbank_type": "1",
  "accountbank_num": "12312312312",
  "url_notify": "https://www.youwebsite.com/urlnotify?orderClient=98745",
  "additional_parameters":
    {
    "parameters1": "keyValue",
    "parameters2": "keyValue",
    "order_ext": "fff-777"
    }
}'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/wallet/payout', [
    'json' => [
        'email' => 'johndoe@example.com',
        'phone' => '123456789',
        'subject' => 'payOut 9876',
        'order' => 9876,
        'currency' => 'CLP',
        'amount' =>  1000,
        'accountbank_name' => 'Jhon Doe',
        'accountbank_rut' => '111111111',
        'accountbank_sbif' => '0001',
        'accountbank_type' => '1',
        'accountbank_num' => '12312312312',
        "url_notify" => "https://www.youwebsite.com/urlnotify?orderClient=98745",
        'additional_parameters' =>
        [
        'parameters1' => 'keyValue',
        'parameters2' => 'keyValue',
        'order_ext' => 'fff-777'
        ]
      ],
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO',
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/wallet/payout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  "email": "johndoe@example.com",
  "phone": "123456789",
  "subject": "PayOut 133222",
  "currency": "CLP",
  "order": 133222,
  "amount":  1000,
  "accountbank_name": "Jhon Doe",
  "accountbank_rut": "111111111",
  "accountbank_sbif": "0001",
  "accountbank_type": "1",
  "accountbank_num": "12312312312",
  "url_notify": "https://www.youwebsite.com/urlnotify?orderClient=98745",
  "additional_parameters":
    {
    "parameters1": "keyValue",
    "parameters2": "keyValue",
    "order_ext": "fff-777"
    }
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "identifier_wallet": "wab5f7232dafff18f9",
  "identifier_payout": "mor33e36b01e8a11b9ee"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la carga a la wallet.Los posibles estados que puede obtener son los siguientes: - success - failed — Ejemplo: `success` |
| `identifier_wallet` | string |  | Identificador del movimiento de la billetera virtual de payku. — Ejemplo: `wab5f7232dafff18f9` |
| `identifier_payout` | string |  | Identificador del pago a tercero. — Ejemplo: `mor33e36b01e8a11b9ee` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Retirar dinero de mi wallet

`POST /api/wallet/withdraw`

Este método permite crear una liquidación a la cuenta bancaria del comercio utilizando los fondos de tu billetera virtual **payku**.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `subject` | string | ✓ | Descripción de la orden — máximo 200 caracteres — Ejemplo: `payment description` |
| `currency` | string | ✓ | Tipo de moneda (Formato ISO) — máximo 6 caracteres — Ejemplo: `CLP` |
| `order` | string | ✓ | Orden del comercio — máximo 80 caracteres — Ejemplo: `98745` |
| `amount` | integer | ✓ | Monto de la orden — máximo 14 dígitos — Ejemplo: `25000` |

**cURL**

```bash
curl -X POST \
https://BASE-URL/api/wallet/withdraw \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
-d '{
  "subject": "withdraw 133222",
  "currency": "CLP",
  "order": "133222",
  "amount":  1000
}'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/wallet/withdraw', [
    'json' => [
        'subject' => 'withdraw 9876',
        'order' => "133222",
        'currency' => 'CLP',
        'amount' =>  1000
      ],
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO',
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/wallet/withdraw', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  "amount":  1000,
  "currency": "CLP",
  "order": "133222",
  "subject": "subject"
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "identifier_wallet": "wab5f7232dafff18f9"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la carga a la wallet.Los posibles estados que puede obtener son los siguientes: - success — Ejemplo: `success` |
| `identifier_wallet` | string |  | Identificador del movimiento de la billetera virtual de payku. — Ejemplo: `wab5f7232dafff18f9` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener saldo

`GET /api/wallet`

Este método permite obtener el saldo de tu billetera virtual **payku**.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/wallet  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/wallet', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO',
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/wallet', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "current_id": "wa8a6171ab83323c37",
  "amount_available": 1766,
  "currency": "CLP",
  "filter": {
    "page": 1,
    "per_page": 1000,
    "currency": "CLP",
    "id": "wa8a6171ab83323c37"
  },
  "wallet_movements": [
    {
      "id": "wa8a6171ab83323c37",
      "order": "tme5",
      "subject": "tme5 asunto",
      "created_at": "2023-06-09 20:07:02",
      "income_expense": "expense",
      "status": "current",
      "amount": "3680",
      "actual_amount": "1766",
      "origin_liquidation": null,
      "currency": "CLP",
      "payout": {
        "id": "war3999847529816f2",
        "phone": "111111111",
        "email": "test@test.com",
        "subject": "subject order",
        "amount": "3680",
        "accountbank_rut": "111111111",
        "accountbank_name": "test",
        "accountbank_type": 1,
        "accountbank_num": 123123123,
        "accountbank_sbif": "0001",
        "status": "pending",
        "update_at": "2023-06-09 21:10:46"
      }
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la carga a la wallet. Los posibles estados que puede obtener son los siguientes: - success — Ejemplo: `success` |
| `current_id` | string |  | Identificador de la billetera virtual de payku "último movimiento". — Ejemplo: `wa8a6171ab83323c37` |
| `amount_available` | integer |  | Monto disponible en la biletera virtual de payku. — Ejemplo: `1766` |
| `currency` | string |  | Descripción de la moneda. — Ejemplo: `CLP` |
| `filter` | object |  | Datos específicos para filtrar los datos. |
| ↳ `page` | integer |  | Página actual. — Ejemplo: `1` |
| ↳ `per_page` | integer |  | Cantidad de movimientos por página. — Ejemplo: `1000` |
| ↳ `currency` | string |  | Descripción de la moneda. — Ejemplo: `CLP` |
| ↳ `id` | string |  | Identificador de la cuenta wallet. — Ejemplo: `wa8a6171ab83323c37` |
| `wallet_movements` | array of objects |  |  |
| ↳ `id` | string |  | Identificador de la billetera virtual. — Ejemplo: `wa8a6171ab83323c37` |
| ↳ `order` | string |  | Identificador de la orden. — Ejemplo: `tme5` |
| ↳ `subject` | string |  | Descripción del movimiento. — Ejemplo: `tme5 asunto` |
| ↳ `created_at` | string |  | Fecha de ejecución del movimiento. — Ejemplo: `2023-06-09 20:07:02` |
| ↳ `income_expense` | string |  | Pago a tercero o retiro a tu cuenta. — Ejemplo: `expense` |
| ↳ `status` | string |  | Estatus del moviminto. — Ejemplo: `current` |
| ↳ `amount` | string |  | Monto del movimiento. — Ejemplo: `3680` |
| ↳ `actual_amount` | string |  | Monto del saldo actual. — Ejemplo: `1766` |
| ↳ `origin_liquidation` | string |  | Origen de la liquidación. |
| ↳ `currency` | string |  | Descripción de la moneda. — Ejemplo: `CLP` |
| ↳ `payout` | object |  | Datos cuenta destino. |
| ↳ ↳ `id` | string |  | Identificador de la cuenta destino. — Ejemplo: `war3999847529816f2` |
| ↳ ↳ `phone` | string |  | Teléfono del titular de cuenta destino. — Ejemplo: `111111111` |
| ↳ ↳ `email` | string |  | Correo del titular de cuenta destino. — Ejemplo: `test@test.com` |
| ↳ ↳ `subject` | string |  | Estatus de la solicitud. — Ejemplo: `subject order` |
| ↳ ↳ `amount` | string |  | Monto a depositado en la cuenta destino. — Ejemplo: `3680` |
| ↳ ↳ `accountbank_rut` | string |  | Rut del titular de la cuenta destino. — Ejemplo: `111111111` |
| ↳ ↳ `accountbank_name` | string |  | Nombre del titular de la cuenta destino. — Ejemplo: `test` |
| ↳ ↳ `accountbank_type` | integer |  | Tipo de cuenta del banco destino. — Ejemplo: `1` |
| ↳ ↳ `accountbank_num` | integer |  | Número de cuenta del banco destino. — Ejemplo: `123123123` |
| ↳ ↳ `accountbank_sbif` | string |  | Código del banco al que pertenece la cuenta bancaria. — Ejemplo: `0001` |
| ↳ ↳ `status` | string |  | Estatus del movimiento. — Ejemplo: `pending` |
| ↳ ↳ `update_at` | string |  | Fecha que se realizo la solicitud. — Ejemplo: `2023-06-09 21:10:46` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

### Obtener movimientos

`GET /api/wallet/list`

Este método permite obtener los movimientos de su billetera virtual **payku**, este método permite una paginación con un máximo de 4000 registros por página, además, posee los siguientes filtros:

Para la paginación es necesario agregar al final del endpoint lo siguiente ?page=1&per_page=100 siendo el primer parámetro el número de la página y el segundo el número de registros por página Como por ejemplo: **api/wallet/list?page=1&per_page=100**.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/wallet/list  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/wallet/list', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO',
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/wallet/list', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "current_id": "wa8a6171ab83323c37",
  "amount_available": 1766,
  "currency": "CLP",
  "filter": {
    "page": 1,
    "per_page": 1000,
    "currency": "CLP",
    "id": "wa8a6171ab83323c37"
  },
  "wallet_movements": [
    {
      "id": "wa8a6171ab83323c37",
      "order": "tme5",
      "subject": "tme5 asunto",
      "created_at": "2023-06-09 20:07:02",
      "income_expense": "expense",
      "status": "current",
      "amount": "3680",
      "actual_amount": "1766",
      "origin_liquidation": null,
      "currency": "CLP",
      "payout": {
        "id": "war3999847529816f2",
        "phone": "111111111",
        "email": "test@test.com",
        "subject": "subject order",
        "amount": "3680",
        "accountbank_rut": "111111111",
        "accountbank_name": "test",
        "accountbank_type": 1,
        "accountbank_num": 123123123,
        "accountbank_sbif": "0001",
        "status": "pending",
        "update_at": "2023-06-09 21:10:46"
      }
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la carga a la wallet. Los posibles estados que puede obtener son los siguientes: - success — Ejemplo: `success` |
| `current_id` | string |  | Identificador de la billetera virtual de payku "último movimiento". — Ejemplo: `wa8a6171ab83323c37` |
| `amount_available` | integer |  | Monto disponible en la biletera virtual de payku. — Ejemplo: `1766` |
| `currency` | string |  | Descripción de la moneda. — Ejemplo: `CLP` |
| `filter` | object |  | Datos específicos para filtrar los datos. |
| ↳ `page` | integer |  | Página actual. — Ejemplo: `1` |
| ↳ `per_page` | integer |  | Cantidad de movimientos por página. — Ejemplo: `1000` |
| ↳ `currency` | string |  | Descripción de la moneda. — Ejemplo: `CLP` |
| ↳ `id` | string |  | Identificador de la cuenta wallet. — Ejemplo: `wa8a6171ab83323c37` |
| `wallet_movements` | array of objects |  |  |
| ↳ `id` | string |  | Identificador de la billetera virtual. — Ejemplo: `wa8a6171ab83323c37` |
| ↳ `order` | string |  | Identificador de la orden. — Ejemplo: `tme5` |
| ↳ `subject` | string |  | Descripción del movimiento. — Ejemplo: `tme5 asunto` |
| ↳ `created_at` | string |  | Fecha de ejecución del movimiento. — Ejemplo: `2023-06-09 20:07:02` |
| ↳ `income_expense` | string |  | Pago a tercero o retiro a tu cuenta. — Ejemplo: `expense` |
| ↳ `status` | string |  | Estatus del moviminto. — Ejemplo: `current` |
| ↳ `amount` | string |  | Monto del movimiento. — Ejemplo: `3680` |
| ↳ `actual_amount` | string |  | Monto del saldo actual. — Ejemplo: `1766` |
| ↳ `origin_liquidation` | string |  | Origen de la liquidación. |
| ↳ `currency` | string |  | Descripción de la moneda. — Ejemplo: `CLP` |
| ↳ `payout` | object |  | Datos cuenta destino. |
| ↳ ↳ `id` | string |  | Identificador de la cuenta destino. — Ejemplo: `war3999847529816f2` |
| ↳ ↳ `phone` | string |  | Teléfono del titular de cuenta destino. — Ejemplo: `111111111` |
| ↳ ↳ `email` | string |  | Correo del titular de cuenta destino. — Ejemplo: `test@test.com` |
| ↳ ↳ `subject` | string |  | Estatus de la solicitud. — Ejemplo: `subject order` |
| ↳ ↳ `amount` | string |  | Monto a depositado en la cuenta destino. — Ejemplo: `3680` |
| ↳ ↳ `accountbank_rut` | string |  | Rut del titular de la cuenta destino. — Ejemplo: `111111111` |
| ↳ ↳ `accountbank_name` | string |  | Nombre del titular de la cuenta destino. — Ejemplo: `test` |
| ↳ ↳ `accountbank_type` | integer |  | Tipo de cuenta del banco destino. — Ejemplo: `1` |
| ↳ ↳ `accountbank_num` | integer |  | Número de cuenta del banco destino. — Ejemplo: `123123123` |
| ↳ ↳ `accountbank_sbif` | string |  | Código del banco al que pertenece la cuenta bancaria. — Ejemplo: `0001` |
| ↳ ↳ `status` | string |  | Estatus del movimiento. — Ejemplo: `pending` |
| ↳ ↳ `update_at` | string |  | Fecha que se realizo la solicitud. — Ejemplo: `2023-06-09 21:10:46` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

### Obtener movimiento

`GET /api/wallet/{identificadorWallet}`

Este método permite obtener un movimiento de su billetera virtual **payku** mediante un identificador:

Para realizar la consulta es necesario agregar al final del endpoint lo siguiente /{identificadorWallet} como por ejemplo: **api/wallet/wa24bg36767**.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/wallet/{identificadorWallet}  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/wallet/{identificadorWallet}', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO',
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/wallet/{identificadorWallet}', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "current_id": "wa8a6171ab83323c37",
  "amount_available": 1766,
  "currency": "CLP",
  "filter": {
    "page": 1,
    "per_page": 1000,
    "currency": "CLP",
    "id": "wa8a6171ab83323c37"
  },
  "wallet_movements": [
    {
      "id": "wa8a6171ab83323c37",
      "order": "tme5",
      "subject": "tme5 asunto",
      "created_at": "2023-06-09 20:07:02",
      "income_expense": "expense",
      "status": "current",
      "amount": "3680",
      "actual_amount": "1766",
      "origin_liquidation": null,
      "currency": "CLP",
      "payout": {
        "id": "war3999847529816f2",
        "phone": "111111111",
        "email": "test@test.com",
        "subject": "subject order",
        "amount": "3680",
        "accountbank_rut": "111111111",
        "accountbank_name": "test",
        "accountbank_type": 1,
        "accountbank_num": 123123123,
        "accountbank_sbif": "0001",
        "status": "pending",
        "update_at": "2023-06-09 21:10:46"
      }
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la carga a la wallet. Los posibles estados que puede obtener son los siguientes: - success — Ejemplo: `success` |
| `current_id` | string |  | Identificador de la billetera virtual de payku "último movimiento". — Ejemplo: `wa8a6171ab83323c37` |
| `amount_available` | integer |  | Monto disponible en la biletera virtual de payku. — Ejemplo: `1766` |
| `currency` | string |  | Descripción de la moneda. — Ejemplo: `CLP` |
| `filter` | object |  | Datos específicos para filtrar los datos. |
| ↳ `page` | integer |  | Página actual. — Ejemplo: `1` |
| ↳ `per_page` | integer |  | Cantidad de movimientos por página. — Ejemplo: `1000` |
| ↳ `currency` | string |  | Descripción de la moneda. — Ejemplo: `CLP` |
| ↳ `id` | string |  | Identificador de la cuenta wallet. — Ejemplo: `wa8a6171ab83323c37` |
| `wallet_movements` | array of objects |  |  |
| ↳ `id` | string |  | Identificador de la billetera virtual. — Ejemplo: `wa8a6171ab83323c37` |
| ↳ `order` | string |  | Identificador de la orden. — Ejemplo: `tme5` |
| ↳ `subject` | string |  | Descripción del movimiento. — Ejemplo: `tme5 asunto` |
| ↳ `created_at` | string |  | Fecha de ejecución del movimiento. — Ejemplo: `2023-06-09 20:07:02` |
| ↳ `income_expense` | string |  | Pago a tercero o retiro a tu cuenta. — Ejemplo: `expense` |
| ↳ `status` | string |  | Estatus del moviminto. — Ejemplo: `current` |
| ↳ `amount` | string |  | Monto del movimiento. — Ejemplo: `3680` |
| ↳ `actual_amount` | string |  | Monto del saldo actual. — Ejemplo: `1766` |
| ↳ `origin_liquidation` | string |  | Origen de la liquidación. |
| ↳ `currency` | string |  | Descripción de la moneda. — Ejemplo: `CLP` |
| ↳ `payout` | object |  | Datos cuenta destino. |
| ↳ ↳ `id` | string |  | Identificador de la cuenta destino. — Ejemplo: `war3999847529816f2` |
| ↳ ↳ `phone` | string |  | Teléfono del titular de cuenta destino. — Ejemplo: `111111111` |
| ↳ ↳ `email` | string |  | Correo del titular de cuenta destino. — Ejemplo: `test@test.com` |
| ↳ ↳ `subject` | string |  | Estatus de la solicitud. — Ejemplo: `subject order` |
| ↳ ↳ `amount` | string |  | Monto a depositado en la cuenta destino. — Ejemplo: `3680` |
| ↳ ↳ `accountbank_rut` | string |  | Rut del titular de la cuenta destino. — Ejemplo: `111111111` |
| ↳ ↳ `accountbank_name` | string |  | Nombre del titular de la cuenta destino. — Ejemplo: `test` |
| ↳ ↳ `accountbank_type` | integer |  | Tipo de cuenta del banco destino. — Ejemplo: `1` |
| ↳ ↳ `accountbank_num` | integer |  | Número de cuenta del banco destino. — Ejemplo: `123123123` |
| ↳ ↳ `accountbank_sbif` | string |  | Código del banco al que pertenece la cuenta bancaria. — Ejemplo: `0001` |
| ↳ ↳ `status` | string |  | Estatus del movimiento. — Ejemplo: `pending` |
| ↳ ↳ `update_at` | string |  | Fecha que se realizo la solicitud. — Ejemplo: `2023-06-09 21:10:46` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

### Obtener payout

`GET /api/payout/{identificadorPayout}`

Este método permite obtener un movimiento de pagos a terceros de su billetera virtual **payku** mediante un identificador:

Para realizar la consulta es necesario agregar al final del endpoint lo siguiente /{identificadorPayout} como por ejemplo: **api/payout/wa24bg36767**.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/payout/{identificadorPayout}  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/payout/{identificadorPayout}', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO',
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/payout/{identificadorPayout}', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "payout": {
    "id": "war3999847529816f2",
    "phone": "111111111",
    "email": "test@test.com",
    "subject": "subject order",
    "amount": "3680",
    "accountbank_rut": "111111111",
    "accountbank_name": "test",
    "accountbank_type": 1,
    "accountbank_num": 123123123,
    "accountbank_sbif": "0001",
    "status": "pending",
    "update_at": "2023-06-09 21:10:46",
    "origin_wallet": "wa1933f37cdaf7d1c6"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `payout` | object |  | Datos cuenta destino. |
| ↳ `id` | string |  | Identificador de la cuenta destino. — Ejemplo: `war3999847529816f2` |
| ↳ `phone` | string |  | Teléfono del titular de cuenta destino. — Ejemplo: `111111111` |
| ↳ `email` | string |  | Correo del titular de cuenta destino. — Ejemplo: `test@test.com` |
| ↳ `subject` | string |  | Estatus de la solicitud. — Ejemplo: `subject order` |
| ↳ `amount` | string |  | Monto a depositado en la cuenta destino. — Ejemplo: `3680` |
| ↳ `accountbank_rut` | string |  | Rut del titular de la cuenta destino. — Ejemplo: `111111111` |
| ↳ `accountbank_name` | string |  | Nombre del titular de la cuenta destino. — Ejemplo: `test` |
| ↳ `accountbank_type` | integer |  | Tipo de cuenta del banco destino. — Ejemplo: `1` |
| ↳ `accountbank_num` | integer |  | Número de cuenta del banco destino. — Ejemplo: `123123123` |
| ↳ `accountbank_sbif` | string |  | Código del banco al que pertenece la cuenta bancaria. — Ejemplo: `0001` |
| ↳ `status` | string |  | Estatus del movimiento. - pending ("payout registrado") - processing ("payout en proceso de pago") - success ("payout depositado exitosamente") - banking_error ("payout rechazado por el banco") - fraud_prevention ("payout rechazado por compliance") — Ejemplo: `pending` |
| ↳ `update_at` | string |  | Fecha que se realizo la solicitud. — Ejemplo: `2023-06-09 21:10:46` |
| ↳ `origin_wallet` | string |  | Id de la wallet origen. — Ejemplo: `wa1933f37cdaf7d1c6` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

### Obtener payout V3

`GET /api/payoutv3/{identificadorPayout}`

Este método permite obtener un movimiento de pagos a terceros de su billetera virtual **payku** mediante un identificador:

Para realizar la consulta es necesario agregar al final del endpoint lo siguiente /{identificadorPayout} como por ejemplo: **api/payoutv3/mor33e36b01e8a11b9ee**.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/payoutv3/{identificadorPayout}  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/payoutv3/{identificadorPayout}', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO',
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/payoutv3/{identificadorPayout}', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "payout": {
    "id": "war3999847529816f2",
    "phone": "111111111",
    "email": "test@test.com",
    "subject": "subject order",
    "amount": "3680",
    "accountbank_rut": "111111111",
    "accountbank_name": "test",
    "accountbank_type": 1,
    "accountbank_num": 123123123,
    "accountbank_sbif": "0001",
    "status": "pending",
    "update_at": "2023-06-09 21:10:46",
    "origin_wallet": "wa1933f37cdaf7d1c6",
    "reason_rejection": " Error CCA 51. Cuenta Beneficiario no Existe, error_creditor_account_not_found"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `payout` | object |  | Datos cuenta destino. |
| ↳ `id` | string |  | Identificador de la cuenta destino. — Ejemplo: `war3999847529816f2` |
| ↳ `phone` | string |  | Teléfono del titular de cuenta destino. — Ejemplo: `111111111` |
| ↳ `email` | string |  | Correo del titular de cuenta destino. — Ejemplo: `test@test.com` |
| ↳ `subject` | string |  | Estatus de la solicitud. — Ejemplo: `subject order` |
| ↳ `amount` | string |  | Monto a depositado en la cuenta destino. — Ejemplo: `3680` |
| ↳ `accountbank_rut` | string |  | Rut del titular de la cuenta destino. — Ejemplo: `111111111` |
| ↳ `accountbank_name` | string |  | Nombre del titular de la cuenta destino. — Ejemplo: `test` |
| ↳ `accountbank_type` | integer |  | Tipo de cuenta del banco destino. — Ejemplo: `1` |
| ↳ `accountbank_num` | integer |  | Número de cuenta del banco destino. — Ejemplo: `123123123` |
| ↳ `accountbank_sbif` | string |  | Código del banco al que pertenece la cuenta bancaria. — Ejemplo: `0001` |
| ↳ `status` | string |  | Estatus del movimiento. - pending ("payout registrado") - processing ("payout en proceso de pago") - success ("payout depositado exitosamente") - banking_error ("payout rechazado por el banco") - fraud_prevention ("payout rechazado por compliance") — Ejemplo: `pending` |
| ↳ `update_at` | string |  | Fecha que se realizo la solicitud. — Ejemplo: `2023-06-09 21:10:46` |
| ↳ `origin_wallet` | string |  | Id de la wallet origen. — Ejemplo: `wa1933f37cdaf7d1c6` |
| ↳ `reason_rejection` | string |  | Motivo del rechazo. — Ejemplo: `Error CCA 51. Cuenta Beneficiario no Existe, error_creditor_account_not_found` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

## Conciliación

Permite obtener las conciliaciones en **payku**.

### Obtener conciliaciones.

`POST /api/conciliation`

Permite obtener las conciliaciones bancaria del dinero generado por su cuenta y depositado por **payku** en los días correspondiente a sus pago.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `date_init` | string | ✓ | **Rango de fecha inicial:** - No puede ser mayor a la fecha actual. - No puede ser mayor a la fecha final. - El rango de la fecha inicial y fecha final no debe ser mayor a 30 días. — Ejemplo: `2023-10-20` |
| `date_end` | string | ✓ | **Rango de fecha final:** - No puede ser mayor a la fecha actual. - No puede ser menor a la fecha inicial. - El rango de la fecha inicial y fecha final no debe ser mayor a 30 días. — Ejemplo: `2023-10-21` |

**cURL**

```bash
curl -X POST \
https://BASE-URL/api/conciliation \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
-d '{
    "date_init": "2023-10-20",
    "date_end": "2023-10-21"
  }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/conciliation', [
    'json' => [
        'date_init' => '2023-10-20',
        'date_end' => '2023-10-21'
      ],
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO',
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/conciliation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  "date_init": "2023-10-20",
  "date_end": "2023-10-21"
};

request(data);
```

**Respuestas**

*200*

```json
{
  "conciliation": [
    {
      "id": "107999",
      "created_at": "2019-10-25 14:10:03",
      "amount_available": 98745,
      "amount_deposit": 0,
      "status": "pending",
      "destiny": "wallet",
      "currency": "CLP",
      "wallet": null,
      "transaction": [
        {
          "transaction_id": "rsyt68j4dhg6k8j54ut698dt6hj84",
          "payment_key": "pra934939d607922f9e",
          "order": "6544",
          "start": "2023-12-16 15:10:33",
          "end": "2023-12-16 15:10:36",
          "deposit_date": "2023-10-05",
          "amount": 250000,
          "fee": 15000,
          "amount_deposit": 235000,
          "media": "Webpay"
        }
      ]
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `conciliation` | array of objects |  |  |
| ↳ `id` | string |  | Identificador de la conciliación creado por payku. — Ejemplo: `107999` |
| ↳ `created_at` | string |  | Fecha de registro. — Ejemplo: `2019-10-25 14:10:03` |
| ↳ `amount_available` | int |  | Monto disponible. — Ejemplo: `98745` |
| ↳ `amount_deposit` | int |  | Monto depositado. — Ejemplo: `0` |
| ↳ `status` | string |  | Estatus de la conciliación. Los posibles estados que puede obtener son los siguientes: - pending - paid_out - deteined - returned — Ejemplo: `pending` |
| ↳ `destiny` | string |  | Destino de la liquidación. — Ejemplo: `wallet` |
| ↳ `currency` | string |  | Moneda. — Ejemplo: `CLP` |
| ↳ `wallet` | string |  | Billetera digital de **payku**. |
| ↳ `transaction` | array of objects |  |  |
| ↳ ↳ `transaction_id` | string |  | Identificador de la transacción creado por **payku**. — Ejemplo: `rsyt68j4dhg6k8j54ut698dt6hj84` |
| ↳ ↳ `payment_key` | string |  | Identificador del cobro creado por **payku**. — Ejemplo: `pra934939d607922f9e` |
| ↳ ↳ `order` | string |  | Identificador de la orden. — Ejemplo: `6544` |
| ↳ ↳ `start` | string |  | Inicio de la transacción. — Ejemplo: `2023-12-16 15:10:33` |
| ↳ ↳ `end` | string |  | Fin de la transacción. — Ejemplo: `2023-12-16 15:10:36` |
| ↳ ↳ `deposit_date` | string |  | Fecha el cual se realizará el depósito al cliente. — Ejemplo: `2023-10-05` |
| ↳ ↳ `amount` | string |  | Monto de la transacción. — Ejemplo: `250000` |
| ↳ ↳ `fee` | string |  | Comisión general. — Ejemplo: `15000` |
| ↳ ↳ `amount_deposit` | int |  | Monto depósito al cliente. — Ejemplo: `235000` |
| ↳ ↳ `media` | string |  | Medio de pago, utilizado por el usuario. — Ejemplo: `Webpay` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

## Bancos

Permite ver la lista de los bancos asociados.

### Obtener lista de bancos por el tipo de moneda

`GET /api/banks?currency=clp`

Este método permite obtener una lista de los bancos asociados filtrados por la moneda.
Para filtrar por la moneda, hay que agregar el query params currency con el valor de la moneda.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/banks  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/banks?currency=clp', [
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/banks?currency=clp', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  const result = await response.json();
  console.log(result)
}
request();
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "banks": [
    {
      "code": "0001",
      "name": "Banco de Chile",
      "currency": "CLP"
    },
    {
      "code": "0012",
      "name": "Banco Estado",
      "currency": "CLP"
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus del endpoint. Los posibles estados que puede obtener son los siguientes: - success — Ejemplo: `success` |
| `banks` | array of objects |  | Ejemplo: `[{"code":"0001","name":"Banco de Chile","currency":"CLP"},{"code":"0012","name":"Banco Estado","currency":"CLP"}]` |
| ↳ `code` | string |  | Código del banco al que pertenece la cuenta bancaria. — Ejemplo: `Banco de Chile` |
| ↳ `name` | string |  | Nombre de la entidad bancaria. — Ejemplo: `Banco de Chile` |
| ↳ `currency` | string |  | Moneda |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "Hay un problema con tu request"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `Hay un problema con tu request` |

## Métodos de pago

Permite ver la lista de los métodos de pago utilizados por payku.

### Obtener lista de los métodos de pago en payku

`GET /api/paymentmethods`

Este método permite obtener una lista de los métodos de pago en payku.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/paymentmethods  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/paymentmethods', [
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/paymentmethods', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "payment_methods": [
    {
      "currency": "CLP",
      "payment": 1,
      "name": "Webpay",
      "description": "Visa, Mastercard, Magna, American, Diners y Redcompra."
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus del endpoint. Los posibles estados que puede obtener son los siguientes: - success — Ejemplo: `success` |
| `payment_methods` | array of objects |  | Ejemplo: `[{"currency":"CLP","payment":1,"name":"Webpay","description":"Visa, Mastercard, Magna, American, Diners y Redcompra."}]` |
| ↳ `description` | string |  | Breve descripción del método de pago. — Ejemplo: `Utiliza tu banco, simplifica tus transferencias.` |
| ↳ `payment` | number |  | Código que pertenece al método de pago. — Ejemplo: `17` |
| ↳ `name` | string |  | Nombre del método de pago. — Ejemplo: `Vepuy` |
| ↳ `currency` | string |  | Moneda |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "Hay un problema con tu request"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `Hay un problema con tu request` |

### Obtener lista de métodos de pago por el tipo de moneda

`GET /api/paymentmethods?currency=clp`

Este método permite obtener una lista de los métodos de pago en payku.
Para filtrar por la moneda, hay que agregar el query params currency con el valor de la moneda.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/paymentmethods?currency=clp  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/paymentmethods?currency=clp', [
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/paymentmethods?currency=clp', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  const result = await response.json();
  console.log(result)
}
request();
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "payment_methods": [
    {
      "currency": "CLP",
      "payment": 1,
      "name": "Webpay",
      "description": "Visa, Mastercard, Magna, American, Diners y Redcompra."
    },
    {
      "currency": "CLP",
      "payment": 9,
      "name": "MACH",
      "description": "Paga en comercios online internacionales y nacionales"
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus del endpoint. Los posibles estados que puede obtener son los siguientes: - success — Ejemplo: `success` |
| `payment_methods` | array of objects |  | Ejemplo: `[{"currency":"CLP","payment":1,"name":"Webpay","description":"Visa, Mastercard, Magna, American, Diners y Redcompra."},{"currency":"CLP","payment":9,"name":"MACH","description":"Paga en comercios online internacionales y nacionales"}]` |
| ↳ `code` | string |  | Código del banco al que pertenece la cuenta bancaria. — Ejemplo: `Banco de Chile` |
| ↳ `name` | string |  | Nombre de la entidad bancaria. — Ejemplo: `Banco de Chile` |
| ↳ `currency` | string |  | Moneda |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "Hay un problema con tu request"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `Hay un problema con tu request` |


---

# Payku API — 🇵🇪 Perú (ES)

> Documentación oficial de la API de Payku para Perú, generada automáticamente desde la especificación OpenAPI (v2.1.01). Fuente: https://docs.payku.com/ · Sandbox: https://des.payku.cl/

URL base: `https://app.payku.cl/` (Default server) · `https://des.payku.cl/` (Sandbox server)

## Introducción

Bienvenido a la API de payku. Puedes usar nuestra API para acceder a los distintos
endpoints de payku, donde podrás generar y gestionar pagos mediante distintos
métodos y obtener información de ellos.

El API está organizado alrededor de REST. Posee URLs predecibles y
orientadas a recursos, y utiliza códigos de respuesta HTTP para indicar el
resultado de la llamada. Todas las respuestas de la API retornan objetos
JSON, incluyendo los errores.

El solicitante debe buscar un código de resultado 200. Si se recibe
cualquier código de resultado distinto de 200, la solicitud o la respuesta
no es válida, lo que significa que los campos no pasaron los controles de
validación de parte de payku. Utilizamos características incluidas en el
protocolo HTTP, como autenticación, los cuales son soportados por la gran
mayoría de los clientes HTTP.

**Importante — ¿Cómo saber si una operación falló?**

No te fíes solo del código HTTP (por ejemplo, 200). En nuestra API, muchas
respuestas con error también llegan con código HTTP 200. Esto es intencional y
forma parte del diseño de la API.

Siempre revisa el contenido JSON de la respuesta y busca el campo `status`:
- Si `status` es `"success"`, la operación se realizó correctamente.
- Si `status` es `"failed"`, hubo un error (por ejemplo, datos inválidos o una
  operación rechazada). Revisa también el mensaje de error que venga en la
  misma respuesta.

## Autenticación

payku utiliza Token Based Authentication sobre HTTPS para la autenticación. Para tener acceso a nuestra API, accede a tu cuenta en la sección de Integración encontrarás la opción de Tokens integración y API. Los request no autenticados o incorrectos retornarán una respuesta de token Invalido.

## API Seguridad

Cada solicitud es requerido tener incluido en el header:
  - Authorization: Bearer **TOKEN-PÚBLICO**

## Firma

En el caso del API de suscripciones, anulación y mall se agregó una capa más de seguridad a través de una firma que se envía en el header del request, para obtener dicha firma es necesario lo siguiente:

Se debe concatenar en formato para url el Request Path junto a todos los parámetros del request, los cuales deben ser ordenados alfabéticamente por key, tal que key=value. Por lo tanto, si el valor de email cliente es “example@domain.com” el formato correcto sería “example%40domain.com” y luego concatenados con el carácter ‘&’.

Una vez que los sets de caracteres son ordenados y concatenados, el hash es calculado usando la función HMAC con cifrado tipo sha256, y el token privado.

**Nota:** Si un elemento de la data, tiene como valor un objeto o arreglo, se excluye de la data. Esta función esta en el ejemplo de PHP y de Javascript.

### Ejemplo PHP
Endpoint de la API:
```php
$request_path = urlencode('/api/suclient');
```
Ordenando los parámetros:
```php
$data = [
  'email' => 'johndoe@example.com',
  'name' => 'John Doe',
  'phone' => '923122312',
  'address' => 'Moneda 101',
  'country' => 'Chile',
  'region' => 'Metropolitana',
  'city' => 'Santiago',
  'postal_code' => '850000',
  'additional_parameters' => [
    'parameter_1' => 'example',
    'parameter_2' => 'example 2',
  ]
];
ksort($data);
```
Transformación de los parámetros a formato url:
```php
    $contador = 0;
    $concatenar = null;

    if (!empty($data) && !is_null($data)) {
        foreach ($data as $key => $val) {
            if(gettype($val)!='array' && gettype($val)!='object'){
                if ($contador>0) {
                    $concatenar .= '&';
                }
                $concatenar .= $key . '=' . urlencode($val);
                $contador++;
            }
        }
    };
```
Concatenación de los parámetros en formato url con el endpoint de la API:
```php
$concat = $request_path.'&'.$concatenar;
```
Firma:
```php
$sign = hash_hmac('sha256', $concat, 'fe551abcef62fcf002dc598922e68f0a');
```

### Ejemplo JavaScript
Importar dependencia CryptoJS:
```javascript
const CryptoJS = require("crypto-js");
```
Endpoint de la API:
```javascript
const requestPath = encodeURIComponent('/api/suclient');
```
Ordenando los parámetros:
```javascript
const data = {
  email: "johndoe@example.com",
  name: "John Doe",
  phone: "923122312",
  address: "Moneda 101",
  country: "Chile",
  region: "Metropolitana",
  city: "Santiago",
  postal_code: "850000"
};
const orderedData = {};
Object.keys(data).sort().forEach(function(key) {
  orderedData[key] = data[key];
  if (typeof orderedData[key] === 'object') {
        delete orderedData[key];
  }
});
```
Transformación de los parámetros a formato url:
```javascript
const arrayConcat = new URLSearchParams(orderedData).toString();
```
Concatenación de los parámetros en formato url con el endpoint de la API:
```javascript
const concat = requestPath + "&" + arrayConcat;
```
Firma:
```javascript
const sign = CryptoJS.HmacSHA256(concat, "fe551abcef62fcf002dc598922e68f0a").toString();
```

El resultado de la firma obtenida para ambos ejemplos es:

```javascript
"c9c86202b1246f6ebeb080d08b3b99a22d36d0e8cffb7fd4e65af0fea4dd12bb"
```

## Errores

payku usa respuestas HTTP convencionales para indicar el éxito o fracaso de un request.
En general, códigos en el rango de los 2xx indican éxito, códigos en el rango 4xx indican
un error que falló debido a la información proporcionada (ej: un parámetro requerido fue
omitido, un pago falló, etc.), y códigos en el rango de los 5xx indican un error con
los servidores de payku (estos son raros).

## Códigos de error
<div class="errorContent">
<table>
  <tbody>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">400</strong>
        <p class="psmall">Bad Request</p>
      </td>
      <td class="errorDescription">Hay un problema con tu request</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">401</strong>
        <p class="psmall">Unauthorized</p>
      </td>
      <td class="errorDescription">Tu token es incorrecto o error de firma</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">403</strong>
        <p class="psmall">Forbidden</p>
      </td>
      <td class="errorDescription">No tienes permiso para ver esta página</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">404</strong>
        <p class="psmall">Not Found</p>
      </td>
      <td class="errorDescription">El recurso especificado no fue encontrado </td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">405</strong>
        <p class="psmall">Method Not Allowed</p>
      </td>
      <td class="errorDescription">Trataste de ingresar a un recurso con un método inválido</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">406</strong>
        <p class="psmall">Not Acceptable</p>
      </td>
      <td class="errorDescription">Solicitaste un formato que no es json</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">410</strong>
        <p class="psmall">Gone</p>
      </td>
      <td class="errorDescription">El recurso solicitado fue removido de nuestros servidores</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">422</strong>
        <p class="psmall">Unprocessable Entity</p>
      </td>
      <td class="errorDescription">No podemos procesar tu solicitud, revísala.</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">429</strong>
        <p class="psmall">Too Many Requests</p>
      </td>
      <td class="errorDescription">¡Estás solicitando muchos recursos! ¡Detente!</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">500</strong>
        <p class="psmall">Internal Server Error</p>
      </td>
      <td class="errorDescription">Tuvimos un problema con nuestro servidor. Inténtalo nuevamente más tarde.</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">503</strong>
        <p class="psmall">Service Unavailable</p>
      </td>
      <td class="errorDescription">Estamos offline por mantenimiento. Inténtalo nuevamente más tarde</td>
    </tr>
  </tbody>
</table>
</div>

## Acceso a la API

Si tienes una cuenta en payku, puedes acceder a la API REST mediante los siguientes endpoints:

<div class="content">
  <table class="center smallTable">
    <thead>
      <tr>
        <th style="text-align:center;"><strong>Site</strong></th>
        <th style="text-align:center;"><strong>BASE URL FOR REST ENDPOINT</strong></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Production</strong></td>
        <td align="center"><a target="_blank" href="https://app.payku.cl/api">https://app.payku.cl/api</a></td>
      </tr>
      <tr>
        <td><strong>Sandbox</strong></td>
        <td><a target="_blank" href="https://des.payku.cl/api">https://des.payku.cl/api</a></td>
      </tr>
    </tbody>
  </table>
</div>

- **Producción**: proporciona acceso directo para generar transacciones reales.
- **Sandbox**: permite probar su integración sin afectar los datos reales.

Cuando aparece el formulario de autenticación con DNI y clave, se debe usar el DNI 11111111 y la clave 123.

## Transacción

Permite la creación de transacciones y posteriormente consultar su estado.
<br>
<div class='container'>
  <img src='https://docs.payku.com/img/diagrams/Diagram-Transaction.png' alt='Avatar' class='image' style='width:100%'>
  <div class='middle'>
    <a target='_blank' href='https://docs.payku.com/img/diagrams/Diagram-Transaction.png' class='text'>Ver diagrama</a>
  </div>
</div>

### Crear transacción

`POST /api/transaction`

Este método permite crear una orden de pago a **payku** y recibe como respuesta la **URL** para redirigir el browser del pagador y el **token** que identifica la transacción.
Una vez que el pagador efectúe el pago exitoso, **payku** notificará el resultado a la página del comercio que se envió en el parámetro **urlnotify**.

**additional_parameters** = permite enviar información adicional para ser registrada en payku asociada a la transacción **order_ext** dentro de additional_parameters, es una palabra reservada, y es útil para asociar la transacción a un identificador único del comercio

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | string | ✓ | Email del usuario — máximo 100 caracteres — Ejemplo: `support@youwebsite.cl` |
| `order` | string | ✓ | Orden del comercio — máximo 40 caracteres — Ejemplo: `987450011` |
| `subject` | string | ✓ | Descripción de la orden — máximo 2000 caracteres — Ejemplo: `test subject` |
| `amount` | float | ✓ | Monto de la orden — máximo 14 dígitos — Ejemplo: `1` |
| `currency` | string |  | Moneda. — máximo 6 caracteres — Ejemplo: `PEN` |
| `payment` | integer |  | Identificador del medio de pago. Si se envía el identificador, el pagador será redireccionado directamente al medio de pago que se indique. - 21 QR Interoperable (Yape, Plin y Otros; Moneda PEN) - 25 Débito, Crédito, Mastercard, Visa y Diners Club — máximo 2 caracteres — Ejemplo: `21` |
| `expired` | string |  | Fecha en la cual expira la transacción **Este campo no es requerido.** Formato permitido (Año-mes-día hora:minuto:segundo) Ejemplo: 2023-10-18 23:59:59 En caso de ser enviado, debe cumplir con las siguiente reglas: - Debe ser mayor a 5 minutos de la fecha actual (hora Santiago). - Se requiere urlreturn, se adjuntará como parámetros GET /?message_error=expired&id=trx60dc327d9e4c094 — Ejemplo: `2023-10-19 13:05:10` |
| `urlreturn` | string |  | url de retorno del comercio donde payku redirigirá al pagador luego de 3 segundos de obtener el resultado de la transacción. — máximo 200 caracteres — Ejemplo: `https://youwebsite.com/urlreturn?orderClient=98745` |
| `urlnotify` | string |  | url callback del comercio donde payku notificara el pago. - Nota: Luego de que el cliente finalice el proceso de pago en su entidad bancaria payku respondera de forma automática al endpoint ingresado en urlnotify el resultado de la operación bancaria. - **Ejemplo Aprobado:** - { - "transaction_id": "9916587765599311", - "payment_key" : "trx32cb779c0a777fc68", - "transaction_key" : "9916581777599311", - "verification_key": "8b3e2202fb086a7de93777ae34d5e18c", - "order": "199", - "status": "success" - } - **Ejemplo Rechazado:** - { - "transaction_id": "9916587765599311", - "payment_key" : "trx32cb779c0a777fc68", - "transaction_key" : "9916581777599311", - "verification_key": "8b3e2202fb086a7de93777ae34d5e18c", - "order": "199", - "status": "failed" - } — máximo 600 caracteres — Ejemplo: `https://www.youwebsite.com/urlnotify?orderClient=98745` |
| `additional_parameters` | object |  | Parámetros adicionales del cliente (Opcional). — máximo 4000 caracteres |
| ↳ `parameters1` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `keyValue` |
| ↳ `parameters2` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `keyValue` |
| ↳ `order_ext` | string |  | Identificador único proporcionado por el comercio, que permita a asociar la transacción a un identificador externo — Ejemplo: `fff-777` |

**cURL**

```bash
curl -X POST \
https://BASE-URL/api/transaction \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
-d '{
  "email": "johndoe@example.com",
  "order": "987450011",
  "subject": "test subject",
  "amount": 1,
  "currency": "PEN",
  "payment": 21,
  "expired": "2023-10-19 13:05:10",
  "urlreturn": "https://youwebsite.com/urlreturn?orderClient=98745",
  "urlnotify": "https://www.youwebsite.com/urlnotify?orderClient=98745",
  "additional_parameters": {
    "parameters1": "keyValue",
    "parameters2": "keyValue",
    "order_ext": "fff-777"
  }
}'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/transaction', [
    'json' => [
      'email' => 'johndoe@example.com',
      'order' => "987450011",
      'subject' => 'test subject',
      'amount' => 1,
      'currency'=> "PEN",
      'payment' => 21,
      'expired' => '2022-10-19 13:05:10',
      'urlreturn' => 'https://youwebsite.com/urlreturn?orderClient=123',
      'urlnotify' => 'https://youwebsite.com/urlnotify?orderClient=123',
        'additional_parameters' => [
          'parameters1'=>'keyValue',
          'parameters2'=>'keyValue2',
          'order_ext'=>'fff-777'
        ]
      ],
    'headers' => [
      'Authorization' => 'Bearer PUBLIC-TOKEN'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
  email: "johndoe@example.com",
  order: "987450011",
  subject: "test subject",
  amount: 1,
  currency: "PEN",
  payment: 21,
  expired: "2022-10-19 13:05:10",
  urlreturn: "https://youwebsite.com/urlreturn?orderClient=123",
  urlnotify: "https://youwebsite.com/urlnotify?orderClient=123",
  additional_parameters: {
    parameters1:"keyValue",
    parameters2:"keyValue2",
    order_ext:"fff-777"
  }
};

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "pending",
  "id": "trx3b4d77b43acd9a720",
  "url": "https://BASE_URL/url_de_pago",
  "hash": "00020000000000000111111222233339030226304E245",
  "qr_image": "data:image/png;base64,......"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de transacción. Los posibles estados que puede obtener son los siguientes: - register - pending - success - rejected — Ejemplo: `pending` |
| `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `trx3b4d77b43acd9a720` |
| `url` | string |  | URL a redireccionar al usuario. — Ejemplo: `https://BASE_URL/url_de_pago` |
| `hash` | string |  | Hash de la transacción para generar el QR. — Ejemplo: `00020000000000000111111222233339030226304E245` |
| `qr_image` | string |  | Imagen del QR. — Ejemplo: `data:image/png;base64,......` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener múltiples transacciones

`GET /api/transaction`

Este método permite obtener la información de las transacciones realizados en payku, este método permite una paginación con un máximo de 4000 registros por página, además, posee los siguientes filtros:
  - date_init: indica la fecha desde donde se desea comenzar la búsqueda de transacciones, si este parámetro no es enviado la busqueda iniciara la fecha actual .
  - date_end: indica la fecha donde se desea que termine la búsqueda de transacciones, si este parámetro no es enviado la busque tendrá como fecha final la fecha actual.
  - estatus: se puede filtrar la búsqueda de las transacciones dependiendo del estatus en la que se encuentra.  por ejemplo.  /api/transaction?success=true ó para traer multiples estatus /api/transaction?pending=true&rejected=true.

para la paginación es necesario agregar al final del endpoint lo siguiente ?page=1&per_page=100 siendo el primer parámetro el número de la página y el segundo el número de registros por página. En caso de querer buscar las transacciones entre las fechas 01-09-2021 y 15-09-2021, además que solo sean las transacciones de estado success, la url a utilizar seria la siguiente:  https://[URL_BASE]/api/transaction?date_init=2021-09-01&date_end=2021-09-15&success=true.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/transaction  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/transaction', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/transaction', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "transaction": [
    {
      "id": "107999",
      "status": "success",
      "created_at": "2019-10-25 14:10:03",
      "email": "johndoe@example.com",
      "amount": 98745,
      "order": "1572023402",
      "subject": "Description",
      "payment": {
        "start": "2023-12-16 15:10:33",
        "end": "2023-12-16 15:10:36",
        "media": "QR Interoperable",
        "transaction_id": 107999,
        "payment_key": "pra934939d607922f9e",
        "transaction_key": null,
        "deposit_date": "2023-10-05",
        "verification_key": "6669cbd982ef54c28f2f15fb9dc5262d",
        "authorization_code": "107742",
        "last_4_digits": "1233",
        "installments": 0,
        "card_type": "VN",
        "additional_parameters": {
          "identificador": "11.111.111-1",
          "banco": "Banco Estado",
          "numero_cuenta": "00126544977"
        },
        "currency": "PEN"
      },
      "nullify": {
        "status": "complete"
      },
      "gateway_response": {
        "status": "success",
        "message": "successful transaction"
      }
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `transaction` | array of objects |  |  |
| ↳ `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `107999` |
| ↳ `status` | string |  | Estatus de transacción. Los posibles estados que puede obtener son los siguientes: - register - pending - success - rejected — Ejemplo: `success` |
| ↳ `created_at` | string |  | Fecha de registro. — Ejemplo: `2019-10-25 14:10:03` |
| ↳ `email` | string |  | Email del usuario — Ejemplo: `johndoe@example.com` |
| ↳ `amount` | int |  | Monto. — Ejemplo: `98745` |
| ↳ `order` | string |  | Número de orden. — Ejemplo: `1572023402` |
| ↳ `subject` | string |  | Descripción de la orden de compra. — Ejemplo: `Description` |
| ↳ `payment` | object |  |  |
| ↳ ↳ `start` | string |  | Inicio de la transacción. — Ejemplo: `2023-12-16 15:10:33` |
| ↳ ↳ `end` | string |  | Fin de la transacción. — Ejemplo: `2023-12-16 15:10:36` |
| ↳ ↳ `media` | string |  | Medio de pago, utilizado por el usuario. — Ejemplo: `QR Interoperable` |
| ↳ ↳ `transaction_id` | int |  | Identificador de la transacción creado por payku. — Ejemplo: `107999` |
| ↳ ↳ `payment_key` | string |  | Identificador del cobro creado por payku. — Ejemplo: `pra934939d607922f9e` |
| ↳ ↳ `transaction_key` | string |  | Identificador de la transacción creado por payku. |
| ↳ ↳ `deposit_date` | string |  | Fecha el cual se realizará el depósito al cliente. — Ejemplo: `2023-10-05` |
| ↳ ↳ `verification_key` | string |  | Código de verificación creado por payku. — Ejemplo: `6669cbd982ef54c28f2f15fb9dc5262d` |
| ↳ ↳ `authorization_code` | string |  | Código de autorización. — Ejemplo: `107742` |
| ↳ ↳ `last_4_digits` | string |  | Últimos 4 dígitos de la tarjeta afiliada. — Ejemplo: `1233` |
| ↳ ↳ `installments` | int |  | Cuotas. — Ejemplo: `0` |
| ↳ ↳ `card_type` | string |  | Tipo de tarjeta. — Ejemplo: `VN` |
| ↳ ↳ `additional_parameters` | object |  | **Ejemplo** de parámetros adicionales que puede enviar payku. |
| ↳ ↳ ↳ `identificador` | string |  | **Ejemplo** del Identificador de la transacción: — Ejemplo: `11.111.111-1` |
| ↳ ↳ ↳ `banco` | string |  | **Ejemplo** del banco el cual se realizo la transacción: — Ejemplo: `Banco Estado` |
| ↳ ↳ ↳ `numero_cuenta` | string |  | **Ejemplo** del número de cuenta el cual se realizo la transacción: — Ejemplo: `00126544977` |
| ↳ ↳ `currency` | string |  | Moneda. — Ejemplo: `PEN` |
| ↳ `nullify` | object |  | Objeto que contiene información de la respuesta de la anulación |
| ↳ ↳ `status` | string |  | Estatus de anulación. Los posibles estados que puede obtener son los siguientes: - pending - awaiting_funds - waiting_bank_details - complete - reverse_deleted - reverse_completed - reverse_deleted — Ejemplo: `complete` |
| ↳ `gateway_response` | object |  | Objeto que contiene información de la respuesta de la transacción |
| ↳ ↳ `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - rejected - refunded partial - refunded — Ejemplo: `success` |
| ↳ ↳ `message` | string |  | Mensaje que describe el estado. - successful transaction - Rechazo de transacción. - Transacción debe reintentarse. - Error en transacción. - Rechazo por error de tasa. - Excede cupo máximo mensual. - Excede límite diario por transacción. - Rubro no autorizado. — Ejemplo: `successful transaction` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

### Obtener transacción

`GET /api/transaction/{identificador}`

Este método permite obtener la información de una transacción realizado en **payku**

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | ID de la transacción a solicitar, payku puede recibir como id tanto el identificador de la transacción como el identificador de cobro: - payment_key - transaction_key — máximo 30 caracteres |

**CURL**

```text
curl -X GET \
https://BASE-URL/api/transaction/ID-IDENTIFICADOR  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/transaction/trx3b4d77b43acd9a720', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/transaction/trx3b4d77b43acd9a720', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "id": "trx3b4d77b43acd9a720",
  "created_at": "2019-10-25 14:10:03",
  "order": "1572023402",
  "email": "johndoe@example.com",
  "subject": "Description",
  "amount": "98745",
  "payment": {
    "start": "2023-12-16 15:10:33",
    "end": "2023-12-16 15:10:36",
    "media": "QR Interoperable",
    "transaction_id": 107999,
    "payment_key": "pra934939d607922f9e",
    "transaction_key": null,
    "deposit_date": "2023-10-05",
    "verification_key": "6669cbd982ef54c28f2f15fb9dc5262d",
    "authorization_code": "107742",
    "last_4_digits": "1233",
    "installments": 0,
    "card_type": "VN",
    "additional_parameters": {
      "identificador": "11.111.111-1",
      "banco": "Banco Estado",
      "numero_cuenta": "00126544977",
      "network": {
        "ip_address": "192.0.2.123"
      }
    },
    "currency": "PEN"
  },
  "nullify": {
    "status": "complete"
  },
  "gateway_response": {
    "status": "success",
    "message": "successful transaction"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - register - pending - success - rejected — Ejemplo: `success` |
| `id` | string |  | Identificador de la transacción creado por payku. — Ejemplo: `trx3b4d77b43acd9a720` |
| `created_at` | string |  | Fecha de registro. — Ejemplo: `2019-10-25 14:10:03` |
| `order` | string |  | Número de orden. — Ejemplo: `1572023402` |
| `email` | string |  | Email del usuario — Ejemplo: `johndoe@example.com` |
| `subject` | string |  | Descripción de la orden de compra. — Ejemplo: `Description` |
| `amount` | string |  | Monto. — Ejemplo: `98745` |
| `payment` | object |  |  |
| ↳ `start` | string |  | Inicio de la transacción. — Ejemplo: `2023-12-16 15:10:33` |
| ↳ `end` | string |  | Fin de la transacción. — Ejemplo: `2023-12-16 15:10:36` |
| ↳ `media` | string |  | Medio de pago, utilizado por el usuario. — Ejemplo: `QR Interoperable` |
| ↳ `transaction_id` | int |  | Identificador de la transacción creado por payku. — Ejemplo: `107999` |
| ↳ `payment_key` | string |  | Identificador del cobro creado por payku. — Ejemplo: `pra934939d607922f9e` |
| ↳ `transaction_key` | string |  | Identificador de la transacción creado por payku. |
| ↳ `deposit_date` | string |  | Fecha el cual se realizará el depósito al cliente. — Ejemplo: `2023-10-05` |
| ↳ `verification_key` | string |  | Código de verificación creado por payku. — Ejemplo: `6669cbd982ef54c28f2f15fb9dc5262d` |
| ↳ `authorization_code` | string |  | Código de autorización. — Ejemplo: `107742` |
| ↳ `last_4_digits` | string |  | Últimos 4 dígitos de la tarjeta afiliada. — Ejemplo: `1233` |
| ↳ `installments` | int |  | Cuotas. — Ejemplo: `0` |
| ↳ `card_type` | string |  | Tipo de tarjeta. — Ejemplo: `VN` |
| ↳ `additional_parameters` | object |  | **Ejemplo** de parámetros adicionales que puede enviar payku. |
| ↳ ↳ `identificador` | string |  | **Ejemplo** del Identificador de la transacción: — Ejemplo: `11.111.111-1` |
| ↳ ↳ `banco` | string |  | **Ejemplo** del banco el cual se realizo la transacción: — Ejemplo: `Banco Estado` |
| ↳ ↳ `numero_cuenta` | string |  | **Ejemplo** del número de cuenta el cual se realizo la transacción: — Ejemplo: `00126544977` |
| ↳ ↳ `network` | object |  | Datos de la red del usuario: |
| ↳ ↳ ↳ `ip_address` | string |  | **Ejemplo** de IP Address del usuario: — Ejemplo: `192.0.2.123` |
| ↳ `currency` | string |  | Moneda. — Ejemplo: `PEN` |
| `nullify` | object |  | Objeto que contiene información de la respuesta de la anulación |
| ↳ `status` | string |  | Estatus de anulación. Los posibles estados que puede obtener son los siguientes: - pending - awaiting_funds - waiting_bank_details - complete - reverse_deleted - reverse_completed — Ejemplo: `complete` |
| `gateway_response` | object |  | Objeto que contiene información de la respuesta de la transacción |
| ↳ `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - rejected - refunded partial - refunded — Ejemplo: `success` |
| ↳ `message` | string |  | Mensaje que describe el estado. - successful transaction - Rechazo de transacción. - Transacción debe reintentarse. - Error en transacción. - Rechazo por error de tasa. - Excede cupo máximo mensual. - Excede límite diario por transacción. - Rubro no autorizado. — Ejemplo: `successful transaction` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

## Wallet

Permite generar transacciones bancarias desde tu billetera virtual **payku**.

### Realizar pagos a terceros desde mi wallet

`POST /api/wallet/payout`

Este método permite crear una orden de pago a un tercero utilizando los fondos de tu billetera virtual **payku**.

**Nota:** Para fines de prueba (Solo ambiente desarrollo), los montos específicos se procesarán automáticamente:
<br>
&bull;  Montos 1000, 2000, 3000: Se marcarán como **aprobados** automáticamente.
<br>
&bull;  Montos 1500, 2500, 3500: Se marcarán como **rechazados** automáticamente.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | string | ✓ | Email del usuario — máximo 50 caracteres — Ejemplo: `johndoe@example.com` |
| `phone` | string |  | Télefono del usuario. **Formato:** 519YYYYYYYY — máximo 20 caracteres — Ejemplo: `51906310864` |
| `subject` | string | ✓ | Descripción de la orden — máximo 200 caracteres — Ejemplo: `test Gmoney peru` |
| `currency` | string | ✓ | Tipo de moneda (Formato ISO) — máximo 6 caracteres — Ejemplo: `PEN` |
| `order` | string | ✓ | Orden del comercio — máximo 50 caracteres — Ejemplo: `0011010101777` |
| `amount` | integer | ✓ | Monto de la orden — máximo 14 dígitos — Ejemplo: `1` |
| `accountbank_name` | string | ✓ | Nombre del titular de la cuenta — máximo 180 caracteres — Ejemplo: `PAYKU PERU SAC` |
| `accountbank_rut` | string | ✓ | Documento de identidad del titular de la cuenta en Perú: DNI, Cédula de Extranjería (CE) o Pasaporte. El nombre del campo se mantiene por compatibilidad. Ejemplo (DNI): 47566578 — entre 7 a 12 caracteres — Ejemplo: `47566578` |
| `accountbank_sbif` | string | ✓ | Código del banco al que pertenece la cuenta bancaria. — máximo 4 caracteres — Ejemplo: `011` |
| `accountbank_type` | string | ✓ | Tipo de cuenta. - 1 Corriente - 3 Ahorro — máximo 1 caracterer — Ejemplo: `1` |
| `accountbank_num` | string | ✓ | Número de CCI (Código de Cuenta Interbancario) del cliente. **Nota: El CCI interbancario es un número compuesto por 20 dígitos. Solo para el caso de YAPE, puede enviar el número de teléfono asociado.** **Formato:** 519YYYYYYYY — máximo 20 caracteres — Ejemplo: `01128901338000251968` |
| `url_notify` | string |  | url donde se notificare el resultado del pago. - Nota: Luego de realizar el pago a terceros payku respondera de forma automática al endpoint ingresado en urlnotify el resultado de la operación. - **Ejemplo Aprobado:** - { - "id": "mpexxzxxxx", - "identifier_payout": "mpexxzxxxx", - "order" : "367734544", - "status" : "success", - "update_at" : "2023-08-24 12:29:35", - "customer" : { - "name" : "Jhon Doe", - "phone" : "987654321", - "document" : "87654321", - "number" : "987654321" - } - } - **Ejemplo Rechazado:** - { - "id": "mpexxzxxxx", - "identifier_payout": "mpexxzxxxx", - "order" : "367734544", - "status" : "banking_error", - "update_at" : "2023-08-24 12:29:35", - "customer" : { - "name" : "Jhon Doe", - "phone" : "987654321", - "document" : "87654321", - "number" : "987654321" - } - } — máximo 600 caracteres — Ejemplo: `https://www.youwebsite.com/urlnotify?orderClient=98745` |
| `additional_parameters` | object |  | Parámetros adicionales del cliente (Opcional). — máximo 4000 caracteres |
| ↳ `parameter_1` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `keyValue` |
| ↳ `parameter_2` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `keyValue` |
| ↳ `order_ext` | string |  | Nombre de la orden externa dado por el usuario payku (Opcional) — Ejemplo: `fff-777` |

**cURL**

```bash
curl -X POST \
https://BASE-URL/api/wallet/payout \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
-d '{
      "email": "johndoe@example.com",
      "phone": "51906310864",
      "subject": "test Gmoney peru",
      "currency": "PEN",
      "order": "0011010101777",
      "amount": 1,
      "accountbank_name": "PAYKU PERU SAC",
      "accountbank_rut": "47566578",
      "accountbank_sbif": "011",
      "accountbank_type": "1",
      "accountbank_num": "01128901338000251968",
      "url_notify": "https://www.youwebsite.com/urlnotify?orderClient=98745",
      "additional_parameters":
      {
        "parameter_1": "keyValue",
        "parameter_2": "keyValue",
        "order_ext": "fff-777"
      }
    }'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/wallet/payout', [
    'json' => [
            "email" => "johndoe@example.com",
            "phone" => "51906310864",
            "subject" => "test Gmoney peru",
            "currency" => "PEN",
            "order" => "0011010101777",
            "amount" => 1,
            "accountbank_name" => "PAYKU PERU SAC",
            "accountbank_rut" => "47566578",
            "accountbank_sbif" => "011",
            "accountbank_type" => "1",
            "accountbank_num" => "01128901338000251968",
            "url_notify" => "https://www.youwebsite.com/urlnotify?orderClient=98745",
            "additional_parameters" => [
                "parameter_1" => "keyValue",
                "parameter_2" => "keyValue",
                "order_ext" => "fff-777"
            ]
        ],
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO',
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/wallet/payout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO',
      'Authorization': 'Bearer TOKEN-PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}

let data = {
      "email": "johndoe@example.com",
      "phone": "51906310864",
      "subject": "test Gmoney peru",
      "currency": "PEN",
      "order": "0011010101777",
      "amount": 1,
      "accountbank_name": "PAYKU PERU SAC",
      "accountbank_rut": "47566578",
      "accountbank_sbif": "011",
      "accountbank_type": "1",
      "accountbank_num": "01128901338000251968",
      "url_notify": "https://www.youwebsite.com/urlnotify?orderClient=98745",
      "additional_parameters":
      {
        "parameter_1": "keyValue",
        "parameter_2": "keyValue",
        "order_ext": "fff-777"
      }
    };

request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "identifier_wallet": "wab5f7232dafff18f9",
  "identifier_payout": "mpe33e36b01e8a11b9ee"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la carga a la wallet.Los posibles estados que puede obtener son los siguientes: - success - failed — Ejemplo: `success` |
| `identifier_wallet` | string |  | Identificador del movimiento de la billetera virtual de payku. — Ejemplo: `wab5f7232dafff18f9` |
| `identifier_payout` | string |  | Identificador del pago a tercero. — Ejemplo: `mpe33e36b01e8a11b9ee` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

### Obtener payout V3

`GET /api/payoutv3/{identificadorPayout}`

Este método permite obtener un movimiento de pagos a terceros de su billetera virtual **payku** mediante un identificador:

Para realizar la consulta es necesario agregar al final del endpoint lo siguiente /{identificadorPayout} como por ejemplo: **api/payoutv3/mpe33e36b01e8a11b9ee**.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/payoutv3/{identificadorPayout}  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/payoutv3/{identificadorPayout}', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO',
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/payoutv3/{identificadorPayout}', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "payout": {
    "id": "war3999847529816f2",
    "phone": "987654321",
    "email": "test@test.com",
    "subject": "subject order",
    "amount": "3680",
    "accountbank_rut": "111111111111",
    "accountbank_name": "test",
    "accountbank_type": 1,
    "accountbank_num": 123123123,
    "accountbank_sbif": "0001",
    "status": "pending",
    "update_at": "2023-06-09 21:10:46",
    "origin_wallet": "wa1933f37cdaf7d1c6",
    "reason_rejection": " Error CCA 51. Cuenta Beneficiario no Existe, error_creditor_account_not_found"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `payout` | object |  | Datos cuenta destino. |
| ↳ `id` | string |  | Identificador de la cuenta destino. — Ejemplo: `war3999847529816f2` |
| ↳ `phone` | string |  | Teléfono del titular de cuenta destino. — Ejemplo: `987654321` |
| ↳ `email` | string |  | Correo del titular de cuenta destino. — Ejemplo: `test@test.com` |
| ↳ `subject` | string |  | Estatus de la solicitud. — Ejemplo: `subject order` |
| ↳ `amount` | string |  | Monto a depositado en la cuenta destino. — Ejemplo: `3680` |
| ↳ `accountbank_rut` | string |  | Documento de identidad del titular de la cuenta destino: DNI, Cédula de Extranjería (CE) o Pasaporte. — Ejemplo: `111111111111` |
| ↳ `accountbank_name` | string |  | Nombre del titular de la cuenta destino. — Ejemplo: `test` |
| ↳ `accountbank_type` | integer |  | Tipo de cuenta del banco destino. — Ejemplo: `1` |
| ↳ `accountbank_num` | integer |  | Número de CCI (Código de Cuenta Interbancario) del banco destino o en caso de YAPE el número celular del beneficiario. — Ejemplo: `123123123` |
| ↳ `accountbank_sbif` | string |  | Código del banco al que pertenece la cuenta bancaria. — Ejemplo: `0001` |
| ↳ `status` | string |  | Estatus del movimiento. - pending ("payout registrado") - processing ("payout en proceso de pago") - success ("payout depositado exitosamente") - banking_error ("payout rechazado por el banco") - fraud_prevention ("payout rechazado por compliance") — Ejemplo: `pending` |
| ↳ `update_at` | string |  | Fecha que se realizo la solicitud. — Ejemplo: `2023-06-09 21:10:46` |
| ↳ `origin_wallet` | string |  | Id de la wallet origen. — Ejemplo: `wa1933f37cdaf7d1c6` |
| ↳ `reason_rejection` | string |  | Motivo del rechazo. — Ejemplo: `Error CCA 51. Cuenta Beneficiario no Existe, error_creditor_account_not_found` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*401* — Token Público incorrecto.

```json
{
  "type": "Unauthorized",
  "message_error": {
    "error": "waiting token public"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unauthorized` |
| `message_error` | object |  |  |
| ↳ `error` | string |  | Mensaje de error — Ejemplo: `waiting token public` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

## Bancos

Permite ver la lista de los bancos asociados.

### Obtener lista de bancos por el tipo de moneda

`GET /api/banks?currency=pen`

Este método permite obtener una lista de los bancos asociados filtrados por la moneda.
Para filtrar por la moneda, hay que agregar el query params currency con el valor de la moneda.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/banks?currency=pen  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/banks?currency=pen', [
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/banks?currency=pen', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  const result = await response.json();
  console.log(result)
}
request();
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "banks": [
    {
      "code": "007",
      "name": "Citibank Perú S.A.",
      "currency": "PEN"
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus del endpoint. Los posibles estados que puede obtener son los siguientes: - success — Ejemplo: `success` |
| `banks` | array of objects |  | Ejemplo: `[{"code":"007","name":"Citibank Perú S.A.","currency":"PEN"}]` |
| ↳ `code` | string |  | Código del banco al que pertenece la cuenta bancaria. — Ejemplo: `Citibank Perú S.A.` |
| ↳ `name` | string |  | Nombre de la entidad bancaria. — Ejemplo: `Citibank Perú S.A.` |
| ↳ `currency` | string |  | Moneda |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "Hay un problema con tu request"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `Hay un problema con tu request` |

## Métodos de pago

Permite ver la lista de los métodos de pago utilizados por payku.

### Obtener lista de métodos de pago por el tipo de moneda

`GET /api/paymentmethods?currency=pen`

Este método permite obtener una lista de los métodos de pago en payku.
Para filtrar por la moneda, hay que agregar el query params currency con el valor de la moneda.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/paymentmethods?currency=pen  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/paymentmethods?currency=pen', [
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/paymentmethods?currency=pen', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  const result = await response.json();
  console.log(result)
}
request();
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "payment_methods": [
    {
      "currency": "PEN",
      "payment": 21,
      "name": "QR Interoperable",
      "description": ""
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus del endpoint. Los posibles estados que puede obtener son los siguientes: - success — Ejemplo: `success` |
| `payment_methods` | array of objects |  | Ejemplo: `[{"currency":"PEN","payment":21,"name":"QR Interoperable","description":""}]` |
| ↳ `description` | string |  | Breve descripción del método de pago. |
| ↳ `payment` | number |  | Código que pertenece al método de pago. — Ejemplo: `21` |
| ↳ `name` | string |  | Nombre del método de pago. — Ejemplo: `QR Interoperable` |
| ↳ `currency` | string |  | Moneda — Ejemplo: `PEN` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "Hay un problema con tu request"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `Hay un problema con tu request` |


---

# Payku API — 🇻🇪 Venezuela (ES)

> Documentación oficial de la API de Payku para Venezuela, generada automáticamente desde la especificación OpenAPI (v2.1.01). Fuente: https://docs.payku.com/ · Sandbox: https://des.payku.cl/

URL base: `https://app.payku.cl/` (Production) · `https://des.payku.cl/` (Sandbox)

## Introducción

Bienvenido a la API de payku. Puedes usar nuestra API para acceder a los distintos
endpoints de payku, donde podrás generar y gestionar pagos mediante distintos
métodos y obtener información de ellos.

El API está organizado alrededor de REST. Posee URLs predecibles y
orientadas a recursos, y utiliza códigos de respuesta HTTP para indicar el
resultado de la llamada. Todas las respuestas de la API retornan objetos
JSON, incluyendo los errores.

El solicitante debe buscar un código de resultado 200. Si se recibe
cualquier código de resultado distinto de 200, la solicitud o la respuesta
no es válida, lo que significa que los campos no pasaron los controles de
validación de parte de payku. Utilizamos características incluidas en el
protocolo HTTP, como autenticación, los cuales son soportados por la gran
mayoría de los clientes HTTP.

**Importante — ¿Cómo saber si una operación falló?**

No te fíes solo del código HTTP (por ejemplo, 200). En nuestra API, muchas
respuestas con error también llegan con código HTTP 200. Esto es intencional y
forma parte del diseño de la API.

Siempre revisa el contenido JSON de la respuesta y busca el campo `status`:
- Si `status` es `"success"`, la operación se realizó correctamente.
- Si `status` es `"failed"`, hubo un error (por ejemplo, datos inválidos o una
  operación rechazada). Revisa también el mensaje de error que venga en la
  misma respuesta.

## Autenticación

payku utiliza Token Based Authentication sobre HTTPS para la autenticación. Para tener acceso a nuestra API, accede a tu cuenta en la sección de Integración encontrarás la opción de Tokens integración y API. Los request no autenticados o incorrectos retornarán una respuesta de token Invalido.

## API Seguridad

Cada solicitud es requerido tener incluido en el header:
  - Authorization: Bearer **TOKEN-PÚBLICO**

## Firma

En el caso del API de pagos a terceros (payout) se agregó una capa más de seguridad a través de una firma que se envía en el header del request, para obtener dicha firma es necesario lo siguiente:

Se debe concatenar en formato para url el Request Path junto a todos los parámetros del request, los cuales deben ser ordenados alfabéticamente por key, tal que key=value. Por lo tanto, si el valor de email cliente es “example@domain.com” el formato correcto sería “example%40domain.com” y luego concatenados con el carácter ‘&’.

Una vez que los sets de caracteres son ordenados y concatenados, el hash es calculado usando la función HMAC con cifrado tipo sha256, y el token privado.

**Nota:** Si un elemento de la data, tiene como valor un objeto o arreglo, se excluye de la data. Esta función esta en el ejemplo de PHP y de Javascript.

### Ejemplo PHP
Endpoint de la API:
```php
$request_path = urlencode('/api/suclient');
```
Ordenando los parámetros:
```php
$data = [
  'email' => 'johndoe@example.com',
  'name' => 'John Doe',
  'phone' => '923122312',
  'address' => 'Moneda 101',
  'country' => 'Chile',
  'region' => 'Metropolitana',
  'city' => 'Santiago',
  'postal_code' => '850000',
  'additional_parameters' => [
    'parameter_1' => 'example',
    'parameter_2' => 'example 2',
  ]
];
ksort($data);
```
Transformación de los parámetros a formato url:
```php
    $contador = 0;
    $concatenar = null;

    if (!empty($data) && !is_null($data)) {
        foreach ($data as $key => $val) {
            if(gettype($val)!='array' && gettype($val)!='object'){
                if ($contador>0) {
                    $concatenar .= '&';
                }
                $concatenar .= $key . '=' . urlencode($val);
                $contador++;
            }
        }
    };
```
Concatenación de los parámetros en formato url con el endpoint de la API:
```php
$concat = $request_path.'&'.$concatenar;
```
Firma:
```php
$sign = hash_hmac('sha256', $concat, 'fe551abcef62fcf002dc598922e68f0a');
```

### Ejemplo JavaScript
Importar dependencia CryptoJS:
```javascript
const CryptoJS = require("crypto-js");
```
Endpoint de la API:
```javascript
const requestPath = encodeURIComponent('/api/suclient');
```
Ordenando los parámetros:
```javascript
const data = {
  email: "johndoe@example.com",
  name: "John Doe",
  phone: "923122312",
  address: "Moneda 101",
  country: "Chile",
  region: "Metropolitana",
  city: "Santiago",
  postal_code: "850000"
};
const orderedData = {};
Object.keys(data).sort().forEach(function(key) {
  orderedData[key] = data[key];
  if (typeof orderedData[key] === 'object') {
        delete orderedData[key];
  }
});
```
Transformación de los parámetros a formato url:
```javascript
const arrayConcat = new URLSearchParams(orderedData).toString();
```
Concatenación de los parámetros en formato url con el endpoint de la API:
```javascript
const concat = requestPath + "&" + arrayConcat;
```
Firma:
```javascript
const sign = CryptoJS.HmacSHA256(concat, "fe551abcef62fcf002dc598922e68f0a").toString();
```

El resultado de la firma obtenida para ambos ejemplos es:

```javascript
"c9c86202b1246f6ebeb080d08b3b99a22d36d0e8cffb7fd4e65af0fea4dd12bb"
```

## Errores

payku usa respuestas HTTP convencionales para indicar el éxito o fracaso de un request.
En general, códigos en el rango de los 2xx indican éxito, códigos en el rango 4xx indican
un error que falló debido a la información proporcionada (ej: un parámetro requerido fue
omitido, un pago falló, etc.), y códigos en el rango de los 5xx indican un error con
los servidores de payku (estos son raros).

## Códigos de error
<div class="errorContent">
<table>
  <tbody>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">400</strong>
        <p class="psmall">Bad Request</p>
      </td>
      <td class="errorDescription">Hay un problema con tu request</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">401</strong>
        <p class="psmall">Unauthorized</p>
      </td>
      <td class="errorDescription">Tu token es incorrecto o error de firma</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">403</strong>
        <p class="psmall">Forbidden</p>
      </td>
      <td class="errorDescription">No tienes permiso para ver esta página</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">404</strong>
        <p class="psmall">Not Found</p>
      </td>
      <td class="errorDescription">El recurso especificado no fue encontrado </td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">405</strong>
        <p class="psmall">Method Not Allowed</p>
      </td>
      <td class="errorDescription">Trataste de ingresar a un recurso con un método inválido</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">406</strong>
        <p class="psmall">Not Acceptable</p>
      </td>
      <td class="errorDescription">Solicitaste un formato que no es json</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">410</strong>
        <p class="psmall">Gone</p>
      </td>
      <td class="errorDescription">El recurso solicitado fue removido de nuestros servidores</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">422</strong>
        <p class="psmall">Unprocessable Entity</p>
      </td>
      <td class="errorDescription">No podemos procesar tu solicitud, revísala.</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">429</strong>
        <p class="psmall">Too Many Requests</p>
      </td>
      <td class="errorDescription">¡Estás solicitando muchos recursos! ¡Detente!</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">500</strong>
        <p class="psmall">Internal Server Error</p>
      </td>
      <td class="errorDescription">Tuvimos un problema con nuestro servidor. Inténtalo nuevamente más tarde.</td>
    </tr>
    <tr>
      <td style="text-align: right"><strong class="errorTitle">503</strong>
        <p class="psmall">Service Unavailable</p>
      </td>
      <td class="errorDescription">Estamos offline por mantenimiento. Inténtalo nuevamente más tarde</td>
    </tr>
  </tbody>
</table>
</div>

## Acceso a la API

Si tienes una cuenta en payku, puedes acceder a la API REST mediante los siguientes endpoints:

<div class="content">
  <table class="center smallTable">
    <thead>
      <tr>
        <th style="text-align:center;"><strong>Site</strong></th>
        <th style="text-align:center;"><strong>BASE URL FOR REST ENDPOINT</strong></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Production</strong></td>
        <td align="center"><a target="_blank" href="https://app.payku.cl">https://app.payku.cl</a></td>
      </tr>
      <tr>
        <td><strong>Sandbox</strong></td>
        <td><a target="_blank" href="https://des.payku.cl">https://des.payku.cl</a></td>
      </tr>
    </tbody>
  </table>
</div>

- **Producción**: proporciona acceso directo para generar transacciones reales.
- **Sandbox**: permite probar su integración sin afectar los datos reales.

## Transacción

### Crear

`POST /api/transaction`

Este método permite crear una orden de pago y recibe como respuesta la **URL** y el **TOKEN** que identifica la transacción.

Parámetros adicionales:

1. **additional_parameters** = Permite enviar información adicional que será registrada con la transacción:

   **IMPORTANTE additional_parameters.gateway:**
   - Permite especificar el medio de pago final
   - **<span style="color: red">OBLIGATORIO</span>** para comercios que usan método On-Site

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | string | ✓ | Email del pagador — ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ — [ 20 .. 100 ] — Ejemplo: `payer@domain.com` |
| `order` | string | ✓ | Orden del comercio — ^[a-zA-Z0-9- ]{1,40}$ — [ 20 .. 40 ] — Ejemplo: `order-commerce-999` |
| `subject` | string | ✓ | Descripción de la orden — ^[a-zA-Z0-9 ]{1,200}$ — [ 1 .. 200 ] — Ejemplo: `description of the order` |
| `amount` | integer | ✓ | Monto de la orden — ^[0-9]+$ — Ejemplo: `100` |
| `currency` | string | ✓ | VES — ISO 4217 — [ 3 .. 3 ] — Ejemplo: `VES` |
| `payment` | integer | ✓ | 17 — ^[0-9]{1,2}$ — Ejemplo: `17` |
| `urlreturn` | string |  | url de retorno del comercio donde se redirigirá al pagador luego de obtener el resultado de la transacción. — ^https:\/\/([\w\-]+\.)+[\w\-]+(\/[\w\-\.\/?%&=]*)?$ — [ 1 .. 255 ] — Ejemplo: `https://youwebsite.com/return/client/order-commerce-999` |
| `urlnotify` | string | ✓ | URL callback del comercio donde se notificará el resultado del pago. **Nota:** Una vez que el cliente finalice el proceso de pago, se notificará a la URL de callback (urlnotify) el resultado de la operación bancaria. **Ejemplo de respuesta exitosa:** ```json { "transaction_id": "991...", "payment_key": "trx...", "transaction_key": "991...", "verification_key": "8b3...", "order": "199...", "status": "success" } ``` **Ejemplo de respuesta rechazada:** ```json { "transaction_id": "991...", "payment_key": "trx3...", "transaction_key": "991...", "verification_key": "8b3e...", "order": "199...", "status": "failed" } ``` — ^https:\/\/([\w\-]+\.)+[\w\-]+(\/[\w\-\.\/?%&=]*)?$ |
| `additional_parameters` | object |  | Parámetros adicionales del comercio. |
| ↳ `gateway` | string |  | Seleccione el método de pago deseado: \| Código \| Método \| Descripción \| On-Site \| \|---------\|--------\|------------\|--------\| \| VZLAVECAP2C \| Pago Móvil (P2C) \| PagoMóvil (Más popular) \| SI \| \| BMIGVECAP2C \| Pago Móvil (P2C) \| PagoMóvil (Más popular) \| \| \| BMIGVECAC2P \| Pago Móvil (C2P) \| BancAmiga (Pago instantáneo) \| \| \| BAMRVECAC2P \| Pago Móvil (C2P) \| Mercantil (Pago instantáneo) \| \| \| UNIOVECAP2C \| Banesco \| BotónPago (Transferencia) \| \| \| VZLAVECABIO \| Tarjetas \| BDV BioPago (Débito y Crédito) \| \| Nota: Para métodos marcados con "On-Site: SI", la respuesta incluirá información adicional: ```json { "status": "register", "id": "trx...", "url": "https://[BASE_URL]/gateway/cobro?id={trx}&valid={hash}", "account_service": { "bank_method": "PA...", "bank_number": "04...", "bank_document": "J-...", "bank_name": "Ban...", "bank_nameshort": "Ve...", "bank_code": "01...", "bank_linkqr": "htt..." }, "attributes_request": { "transaction": "trx...", "payer": { "phone_number": "required", "payment_reference": "required", "id_number": "required", "bank_code": "required", "payment_date": "optional" } } } ``` Campos importantes en la respuesta On-Site: - status: Estado inicial de la transacción - id: Identificador único de la transacción - url: URL para completar el pago, ej. `/gateway/cobro?id={trx}&valid={hash}` - account_service: Información bancaria para mostrar en el formulario de pago - attributes_request: Datos requeridos para completar el pago — Ejemplo: `CODE` |

**cURL**

```bash
curl -X POST \
https://BASE-URL/api/transaction \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLIC' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
-d '{
  "email": "payer@domain.com",
  "order": "order-commerce-999",
  "subject": "description of the order",
  "amount": 100,
  "currency": "VES",
  "payment": 17,
  "urlreturn": "https://youwebsite.com/return/client/order-commerce-999",
  "urlnotify": "https://youwebsite.com/callback/commerce/order-commerce-999",
  "additional_parameters": {
    "gateway":"GATEWAY_CODE"
  }
}'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('POST', 'https://BASE_URL/api/transaction', [
    'json' => [
      'email' => 'payer@domain.com',
      'order' => 'order-commerce-999',
      'subject' => 'description of the order',
      'amount' => 100,
      'currency' => 'VES',
      'payment' => 17,
      'urlreturn' => 'https://youwebsite.com/return/client/order-commerce-999',
      'urlnotify' => 'https://youwebsite.com/callback/commerce/order-commerce-999',
      'additional_parameters' => [
        'gateway' => 'GATEWAY_CODE'
      ]
    ],
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const data = {
  "email": "payer@domain.com",
  "order": "order-commerce-999",
  "subject": "description of the order",
  "amount": 100,
  "currency": "VES",
  "payment": 17,
  "urlreturn": "https://youwebsite.com/return/client/order-commerce-999",
  "urlnotify": "https://youwebsite.com/callback/commerce/order-commerce-999",
  "additional_parameters": {
    "gateway": "GATEWAY_CODE"
  }
};
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}
request(data);
```

**Respuestas**

*200*

```json
{
  "status": "register",
  "id": "trx6...",
  "url": "https://[BASE_URL]/path?id=trx...&valid=e3c4...",
  "account_service": {
    "bank_method": "PA..",
    "bank_number": "04...",
    "bank_document": "J...",
    "bank_name": "Ban...",
    "bank_nameshort": "Ve...",
    "bank_code": "01...",
    "bank_linkqr": "ht..."
  },
  "attributes_request": {
    "transaction": "tr...",
    "payer": {
      "phone_number": "string",
      "payment_reference": "required"
    }
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de transacción. Los posibles estados que puede obtener son los siguientes: - register - success — Ejemplo: `register` |
| `id` | string |  | Identificador único de la transacción — Ejemplo: `trx6...` |
| `url` | string |  | URL para redireccionar al usuario. — Ejemplo: `https://[BASE_URL]/path?id=trx...&valid=e3c4...` |
| `account_service` | object |  | **[!SOLO PARA MÉTODOS ON-SITE!]** Información del servicio bancario que debe ser utilizado para el pago. |
| ↳ `bank_method` | string |  | Método de pago bancario — Ejemplo: `PA..` |
| ↳ `bank_number` | string |  | Número de teléfono para pago móvil — Ejemplo: `04...` |
| ↳ `bank_document` | string |  | Documento de identificación bancaria — Ejemplo: `J...` |
| ↳ `bank_name` | string |  | Nombre completo del banco — Ejemplo: `Ban...` |
| ↳ `bank_nameshort` | string |  | Nombre corto del banco — Ejemplo: `Ve...` |
| ↳ `bank_code` | string |  | Código del banco — Ejemplo: `01...` |
| ↳ `bank_linkqr` | string |  | URL del código QR para el pago — Ejemplo: `ht...` |
| `attributes_request` | object |  | **[!SOLO PARA MÉTODOS ON-SITE!]** Datos requeridos para completar para informar el pago. |
| ↳ `transaction` | string |  | Identificador de la transacción — Ejemplo: `tr...` |
| ↳ `payer` | object |  | Información requerida del pagador |
| ↳ ↳ `phone_number` | string |  | Número de teléfono del pagador |
| ↳ ↳ `payment_reference` | string |  | Referencia del pago — Ejemplo: `required` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

### Confirmar On-Site

`POST /gateway/cobro?id={trx}&valid={hash}`

Este método permite confirmar el pago en el sitio web del comercio, enviando información del pagador para que pueda ser verificada. El resultado de la transacción será informado en el callback [urlnotify].

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `transaction` | string | ✓ | Identificador único de la transacción — Ejemplo: `trx24...` |
| `payer` | object | ✓ | Información del pagador |
| ↳ `phone_number` | string | ✓ | Número de teléfono del pagador — Ejemplo: `04129874563` |
| ↳ `payment_reference` | string | ✓ | Referencia del pago emitido por la entidad bancaria — Ejemplo: `12345600` |
| ↳ `id_number` | string | ✓ | Número de identificación del pagador — Ejemplo: `V12987456` |
| ↳ `bank_code` | string | ✓ | Código del banco del pagador — Ejemplo: `0102` |
| ↳ `payment_date` | string |  | Fecha del pago (opcional) — Ejemplo: `2026-08-25` |

**cURL**

```bash
curl -X POST \
'https://BASE_URL/gateway/cobro?id={trx}&valid={hash}' \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLIC' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
-d '{
  "transaction": "trx2...",
  "payer": {
    "phone_number": "04129874563",
    "payment_reference": "12345600",
    "id_number": "V12987456",
    "bank_code": "0102",
    "payment_date": "2026-08-25"
  }
}'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
$body = $client->request('POST', 'https://BASE_URL/gateway/cobro?id={trx}&valid={hash}', [
  'json' => [
    'transaction' => 'trx2...',
    'payer' => [
      'phone_number' => '04129874563',
      'payment_reference' => '12345600',
      'id_number' => 'V12987456',
      'bank_code' => '0102',
      'payment_date' => '2026-08-25'
    ]
  ],
  'headers' => [
    'Authorization' => 'Bearer TOKEN_PUBLICO'
  ]
])->getBody();
$response = json_decode($body);
```

**JS**

```js
const data = {
  "transaction": "trx2...",
  "payer": {
    "phone_number": "04129874563",
    "payment_reference": "12345600",
    "id_number": "V12987456",
    "bank_code": "0102",
    "payment_date": "2026-08-25"
  }
};
const request = async (data) => {
  const response = await fetch('https://BASE_URL/gateway/cobro?id={trx}&valid={hash}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN_PUBLICO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}
request(data);
```

**Respuestas**

*200* — Respuesta exitosa

```json
{
  "transaction": "trx24...",
  "status": "register",
  "message": "payment received and pending verification",
  "gateway": {
    "status": "successful"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `transaction` | string | ✓ | Identificador único de la transacción — Ejemplo: `trx24...` |
| `status` | string | ✓ | Estado de la transacción — Ejemplo: `register` |
| `message` | string | ✓ | Mensaje descriptivo del estado — Ejemplo: `payment received and pending verification` |
| `gateway` | object | ✓ | Información del gateway de pago |
| ↳ `status` | string |  | Estado del gateway — Ejemplo: `successful` |

*400* — Error en la solicitud

```json
{
  "transaction": "trx24...",
  "status": "failed",
  "message_error": "charge already used or consumed"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `transaction` | string | ✓ | Identificador único de la transacción — Ejemplo: `trx24...` |
| `status` | string | ✓ | Estado de la transacción — Ejemplo: `failed` |
| `message_error` | string | ✓ | Mensaje descriptivo del error — Ejemplo: `charge already used or consumed` |

### Obtener

`GET /api/transaction/{id}`

Este método permite obtener la información de una transacción

**Parámetros de ruta**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `id` | string | ✓ | Identificador único de la transacción - id: Identificador de la transacción (Transaccion/POST) — máximo 40 caracteres |

**Respuestas**

*200*

```json
{
  "status": "success",
  "id": "trx3b...",
  "created_at": "2025-10-25 14:10:03",
  "order": "157...",
  "email": "payer@domain.com",
  "subject": "description of the order",
  "amount": 100,
  "payment": {
    "start": "2025-12-16 15:10:33",
    "end": "2025-12-16 15:10:36",
    "media": "VEPUY",
    "transaction_id": 107999,
    "payment_key": "pr...",
    "transaction_key": null,
    "deposit_date": "2023-10-05",
    "verification_key": "666...",
    "authorization_code": "10...",
    "last_4_digits": "0000",
    "installments": 0,
    "card_type": "VN",
    "additional_parameters": {
      "gateway": "CODE_GATEWAY",
      "network": {
        "ip_address": "192.0.2.123"
      }
    },
    "currency": "VES"
  },
  "nullify": {
    "status": "complete"
  },
  "gateway_response": {
    "status": "success",
    "message": "successful transaction"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - register - pending - success - rejected — Ejemplo: `success` |
| `id` | string |  | Identificador único de la transacción — Ejemplo: `trx3b...` |
| `created_at` | string |  | Fecha de registro. — Ejemplo: `2025-10-25 14:10:03` |
| `order` | string |  | Número de orden. — Ejemplo: `157...` |
| `email` | string |  | Email del usuario — Ejemplo: `payer@domain.com` |
| `subject` | string |  | Descripción de la orden de compra. — Ejemplo: `description of the order` |
| `amount` | string |  | Monto. — Ejemplo: `100` |
| `payment` | object |  |  |
| ↳ `start` | string |  | Inicio de la transacción. — Ejemplo: `2025-12-16 15:10:33` |
| ↳ `end` | string |  | Fin de la transacción. — Ejemplo: `2025-12-16 15:10:36` |
| ↳ `media` | string |  | Medio de pago, utilizado por el usuario. — Ejemplo: `VEPUY` |
| ↳ `transaction_id` | int |  | Identificador único de la transacción — Ejemplo: `107999` |
| ↳ `payment_key` | string |  | Identificador del cobro creado por payku. — Ejemplo: `pr...` |
| ↳ `transaction_key` | string |  | Identificador único de la transacción |
| ↳ `deposit_date` | string |  | Fecha el cual se realizará el depósito al cliente. — Ejemplo: `2023-10-05` |
| ↳ `verification_key` | string |  | Código de verificación creado por payku. — Ejemplo: `666...` |
| ↳ `authorization_code` | string |  | Código de autorización. — Ejemplo: `10...` |
| ↳ `last_4_digits` | string |  | Últimos 4 dígitos de la tarjeta afiliada. — Ejemplo: `0000` |
| ↳ `installments` | int |  | Cuotas. — Ejemplo: `0` |
| ↳ `card_type` | string |  | Tipo de tarjeta. — Ejemplo: `VN` |
| ↳ `additional_parameters` | object |  | **Ejemplo** de parámetros adicionales que puede enviar payku. |
| ↳ ↳ `gateway` | string |  | Ejemplo: `CODE_GATEWAY` |
| ↳ ↳ `network` | object |  | Datos de la red del usuario: |
| ↳ ↳ ↳ `ip_address` | string |  | **Ejemplo** de IP Address del usuario: — Ejemplo: `192.0.2.123` |
| ↳ `currency` | string |  | Moneda. — Ejemplo: `VES` |
| `nullify` | object |  | Objeto que contiene información de la respuesta de la anulación |
| ↳ `status` | string |  | Estatus de anulación. Los posibles estados que puede obtener son los siguientes: - pending - awaiting_funds - waiting_bank_details - complete - reverse_deleted - reverse_completed — Ejemplo: `complete` |
| `gateway_response` | object |  | Objeto que contiene información de la respuesta de la transacción |
| ↳ `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - rejected - refunded partial - refunded — Ejemplo: `success` |
| ↳ `message` | string |  | Mensaje que describe el estado. - successful transaction - Rechazo de transacción. - Transacción debe reintentarse. - Error en transacción. - Rechazo por error de tasa. - Excede cupo máximo mensual. - Excede límite diario por transacción. - Rubro no autorizado. — Ejemplo: `successful transaction` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

### Listar

`GET /api/transaction?success=true`

Este método permite obtener la información de las transacciones realizados en payku, permite una paginación con un máximo de 4000 registros por página.

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| date_init | Fecha inicial para la búsqueda de transacciones. Si no se especifica, se usa la fecha actual | date_init=2025-01-01 |
| date_end | Fecha final para la búsqueda de transacciones. Si no se especifica, se usa la fecha actual | date_end=2025-12-31 |
| success | Filtra transacciones exitosas | success=true |
| pending | Filtra transacciones pendientes | pending=true |
| rejected | Filtra transacciones rechazadas | rejected=true |
| page | Número de página para paginación | page=1 |
| per_page | Cantidad de registros por página (máximo 4000) | per_page=100 |

**Ejemplo de URL completa:**
```
https://[URL_BASE]/api/transaction?date_init=2025-01-01&date_end=2025-12-31&success=true&page=1&per_page=100
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "id": "trx3b...",
  "created_at": "2025-10-25 14:10:03",
  "order": "157...",
  "email": "payer@domain.com",
  "subject": "description of the order",
  "amount": 100,
  "payment": {
    "start": "2025-12-16 15:10:33",
    "end": "2025-12-16 15:10:36",
    "media": "VEPUY",
    "transaction_id": 107999,
    "payment_key": "pr...",
    "transaction_key": null,
    "deposit_date": "2023-10-05",
    "verification_key": "666...",
    "authorization_code": "10...",
    "last_4_digits": "0000",
    "installments": 0,
    "card_type": "VN",
    "additional_parameters": {
      "gateway": "CODE_GATEWAY",
      "network": {
        "ip_address": "192.0.2.123"
      }
    },
    "currency": "VES"
  },
  "nullify": {
    "status": "complete"
  },
  "gateway_response": {
    "status": "success",
    "message": "successful transaction"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - register - pending - success - rejected — Ejemplo: `success` |
| `id` | string |  | Identificador único de la transacción — Ejemplo: `trx3b...` |
| `created_at` | string |  | Fecha de registro. — Ejemplo: `2025-10-25 14:10:03` |
| `order` | string |  | Número de orden. — Ejemplo: `157...` |
| `email` | string |  | Email del usuario — Ejemplo: `payer@domain.com` |
| `subject` | string |  | Descripción de la orden de compra. — Ejemplo: `description of the order` |
| `amount` | string |  | Monto. — Ejemplo: `100` |
| `payment` | object |  |  |
| ↳ `start` | string |  | Inicio de la transacción. — Ejemplo: `2025-12-16 15:10:33` |
| ↳ `end` | string |  | Fin de la transacción. — Ejemplo: `2025-12-16 15:10:36` |
| ↳ `media` | string |  | Medio de pago, utilizado por el usuario. — Ejemplo: `VEPUY` |
| ↳ `transaction_id` | int |  | Identificador único de la transacción — Ejemplo: `107999` |
| ↳ `payment_key` | string |  | Identificador del cobro creado por payku. — Ejemplo: `pr...` |
| ↳ `transaction_key` | string |  | Identificador único de la transacción |
| ↳ `deposit_date` | string |  | Fecha el cual se realizará el depósito al cliente. — Ejemplo: `2023-10-05` |
| ↳ `verification_key` | string |  | Código de verificación creado por payku. — Ejemplo: `666...` |
| ↳ `authorization_code` | string |  | Código de autorización. — Ejemplo: `10...` |
| ↳ `last_4_digits` | string |  | Últimos 4 dígitos de la tarjeta afiliada. — Ejemplo: `0000` |
| ↳ `installments` | int |  | Cuotas. — Ejemplo: `0` |
| ↳ `card_type` | string |  | Tipo de tarjeta. — Ejemplo: `VN` |
| ↳ `additional_parameters` | object |  | **Ejemplo** de parámetros adicionales que puede enviar payku. |
| ↳ ↳ `gateway` | string |  | Ejemplo: `CODE_GATEWAY` |
| ↳ ↳ `network` | object |  | Datos de la red del usuario: |
| ↳ ↳ ↳ `ip_address` | string |  | **Ejemplo** de IP Address del usuario: — Ejemplo: `192.0.2.123` |
| ↳ `currency` | string |  | Moneda. — Ejemplo: `VES` |
| `nullify` | object |  | Objeto que contiene información de la respuesta de la anulación |
| ↳ `status` | string |  | Estatus de anulación. Los posibles estados que puede obtener son los siguientes: - pending - awaiting_funds - waiting_bank_details - complete - reverse_deleted - reverse_completed — Ejemplo: `complete` |
| `gateway_response` | object |  | Objeto que contiene información de la respuesta de la transacción |
| ↳ `status` | string |  | Estatus de transacción.Los posibles estados que puede obtener son los siguientes: - pending - success - rejected - refunded partial - refunded — Ejemplo: `success` |
| ↳ `message` | string |  | Mensaje que describe el estado. - successful transaction - Rechazo de transacción. - Transacción debe reintentarse. - Error en transacción. - Rechazo por error de tasa. - Excede cupo máximo mensual. - Excede límite diario por transacción. - Rubro no autorizado. — Ejemplo: `successful transaction` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

## Wallet

### Realizar pagos a terceros desde mi wallet

`POST /api/wallet/payout`

Este método permite crear una orden de pago a un tercero utilizando los fondos de tu billetera virtual **payku**.

**Nota:** Para fines de prueba (Solo ambiente desarrollo), los montos específicos se procesarán automáticamente:
<br>
&bull;  Montos 1000, 2000, 3000: Se marcarán como **aprobados** automáticamente.
<br>
&bull;  Montos 1500, 2500, 3500: Se marcarán como **rechazados** automáticamente.

**Cuerpo de la solicitud**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | string | ✓ | Email del usuario — máximo 50 caracteres — Ejemplo: `payer@domain.com` |
| `phone` | string |  | Télefono del usuario — máximo 20 caracteres — Ejemplo: `04149876543` |
| `subject` | string | ✓ | Descripción de la orden — máximo 200 caracteres — Ejemplo: `description of the order` |
| `currency` | string | ✓ | Tipo de moneda (Formato ISO) — máximo 6 caracteres — Ejemplo: `VES` |
| `order` | string | ✓ | Orden del comercio — máximo 50 caracteres — Ejemplo: `order-commerce-999` |
| `amount` | integer | ✓ | Monto de la orden — máximo 14 dígitos — Ejemplo: `1000` |
| `accountbank_name` | string | ✓ | Nombre del titular de la cuenta — máximo 180 caracteres — Ejemplo: `John Doe` |
| `accountbank_rut` | string | ✓ | Cédula de identidad del titular Formato: (V/E/J) VXXXXXXXX — máximo 15 caracteres — Ejemplo: `V23654789` |
| `accountbank_sbif` | string | ✓ | Código del banco al que pertenece la cuenta bancaria. - 0102 Banco De Venezuela - 0104 Banco Venezolano De Credito - 0105 Banco Mercantil - 0108 Banco Provincial - 0114 Banco Del Caribe - 0115 Banco Exterior - 0128 Banco Caroni - 0134 Banesco - 0138 Banco Plaza - 0151 Banco Fondo Común - 0156 100% Banco - 0163 Banco Del Tesoro - 0171 Banco Activo - 0172 Bancamiga - 0174 Banplus - 0175 Banco Bicentenario - 0191 Banco Nacional De Credito — máximo 4 caracteres — Ejemplo: `0102` |
| `accountbank_type` | string | ✓ | Tipo de cuenta. - 1 Corriente - 3 Ahorro — máximo 1 caracter — Ejemplo: `1` |
| `accountbank_num` | string | ✓ | Número de cuenta del cliente en Venezuela Formato: (0412 / 0414 / 0424 / 0426 / 0416) 9876543 — máximo 200 caracteres — Ejemplo: `04149876543` |
| `url_notify` | string |  | Callback donde se notificará el resultado del pago. - Nota: Luego de realizar el pago a terceros payku respondera de forma automática al endpoint ingresado en urlnotify el resultado de la operación. - **Ejemplo Aprobado:** - { - "id": "morexzxxxx", - "identifier_payout": "morexzxxxx", - "order" : "367734544", - "status" : "success", - "update_at" : "2023-08-24 12:29:35", - "customer" : { - "name" : "Jhon Doe", - "phone" : "04149876543", - "document" : "V23654789", - "number" : "04149876543" - } - } - **Ejemplo Rechazado:** - { - "id": "morexzxxxx", - "identifier_payout": "morexzxxxx", - "order" : "367734544", - "status" : "banking_error", - "update_at" : "2023-08-24 12:29:35", - "customer" : { - "name" : "Jhon Doe", - "phone" : "04149876543", - "document" : "V23654789", - "number" : "04149876543" - } - } — máximo 600 caracteres — Ejemplo: `https://youwebsite.com/callback/commerce/order-commerce-999` |
| `additional_parameters` | object |  | Parámetros adicionales del cliente (Opcional). — máximo 4000 caracteres |
| ↳ `parameter_1` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `keyValue` |
| ↳ `parameter_2` | string |  | Nombre del parámetro dado por el usuario payku — Ejemplo: `keyValue` |

**cURL**

```bash
curl -X POST \
https://BASE-URL/api/wallet/payout \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
-d '{
  "email": "payer@domain.com",
  "phone": "04149876543",
  "subject": "payOut description 9876",
  "currency": "VES",
  "order": "9876",
  "amount": 1000,
  "accountbank_name": "Jhon Doe",
  "accountbank_rut": "V23654789",
  "accountbank_sbif": "0102",
  "accountbank_type": "1",
  "accountbank_num": "04149876543",
  "url_notify": "https://youwebsite.com/urlnotify?orderClient=9876",
  "additional_parameters": {
    "custom_parameter_1": "keyValue",
    "custom_parameter_2": "SpecificValue2",
    "external_reference": "REF-777"
  }
}'
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
$body = $client->request('POST', 'https://BASE_URL/api/wallet/payout', [
  'json' => [
    'email' => 'payer@domain.com',
    'phone' => '04149876543',
    'subject' => 'payOut description 9876',
    'currency' => 'VES',
    'order' => '9876',
    'amount' => 1000,
    'accountbank_name' => 'Jhon Doe',
    'accountbank_rut' => 'V23654789',
    'accountbank_sbif' => '0102',
    'accountbank_type' => '1',
    'accountbank_num' => '04149876543',
    'url_notify' => 'https://youwebsite.com/urlnotify?orderClient=9876',
    'additional_parameters' => [
      'custom_parameter_1' => 'keyValue',
      'custom_parameter_2' => 'SpecificValue2',
      'external_reference' => 'REF-777'
    ]
  ],
  'headers' => [
    'Authorization' => 'Bearer TOKEN_PUBLICO',
    'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
  ]
])->getBody();
$response = json_decode($body);
```

**JS**

```js
const data = {
  "email": "payer@domain.com",
  "phone": "04149876543",
  "subject": "payOut description 9876",
  "currency": "VES",
  "order": "9876",
  "amount": 1000,
  "accountbank_name": "Jhon Doe",
  "accountbank_rut": "V23654789",
  "accountbank_sbif": "0102",
  "accountbank_type": "1",
  "accountbank_num": "04149876543",
  "url_notify": "https://youwebsite.com/urlnotify?orderClient=9876",
  "additional_parameters": {
    "custom_parameter_1": "keyValue",
    "custom_parameter_2": "SpecificValue2",
    "external_reference": "REF-777"
  }
};
const request = async (data) => {
  const response = await fetch('https://BASE_URL/api/wallet/payout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN_PUBLICO',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result)
}
request(data);
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "identifier_wallet": "wvb5f7232dafff18f9",
  "identifier_payout": "mv40746ab8eff910f41e"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estado de la carga a la wallet. Los posibles estados son: - success: exitosa - failed: fallida — Ejemplo: `success` |
| `identifier_wallet` | string |  | Identificador del movimiento de la billetera virtual de payku. — Ejemplo: `wvb5f7232dafff18f9` |
| `identifier_payout` | string |  | Identificador del pago a tercero. — Ejemplo: `mv40746ab8eff910f41e` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

### Obtener payout V3

`GET /api/payoutv3/{identificadorPayout}`

Este método permite obtener un movimiento de pagos a terceros de su billetera virtual **payku** mediante un identificador:

Para realizar la consulta es necesario agregar al final del endpoint lo siguiente /{identificadorPayout} como por ejemplo: **api/payoutv3/wa24bg36767**.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/payoutv3/{identificadorPayout}  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Authorization: Bearer TOKEN-PUBLICO' \
-H 'Sign: SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'  \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/payoutv3/{identificadorPayout}', [
    'headers' => [
      'Authorization' => 'Bearer TOKEN_PUBLICO',
      'Sign' => 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    ]
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/payoutv3/{identificadorPayout}', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN-PUBLICO',
      'Sign': 'SHA256-REQUEST-PATH-VALUE-TOKEN-PRIVADO'
    },
  });
  const result = await response.json();
  console.log(result)
}

request();
```

**Respuestas**

*200*

```json
{
  "payout": {
    "id": "war3999847529816f2",
    "phone": "111111111",
    "email": "test@test.com",
    "subject": "subject order",
    "amount": "3680",
    "accountbank_rut": "V23654789",
    "accountbank_name": "test",
    "accountbank_type": 1,
    "accountbank_num": 123123123,
    "accountbank_sbif": "0102",
    "status": "pending",
    "update_at": "2023-06-09 21:10:46",
    "origin_wallet": "wa1933f37cdaf7d1c6",
    "reason_rejection": " Error CCA 51. Cuenta Beneficiario no Existe, error_creditor_account_not_found"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `payout` | object |  | Datos cuenta destino. |
| ↳ `id` | string |  | Identificador de la cuenta destino. — Ejemplo: `war3999847529816f2` |
| ↳ `phone` | string |  | Teléfono del titular de cuenta destino. — Ejemplo: `111111111` |
| ↳ `email` | string |  | Correo del titular de cuenta destino. — Ejemplo: `test@test.com` |
| ↳ `subject` | string |  | Estatus de la solicitud. — Ejemplo: `subject order` |
| ↳ `amount` | string |  | Monto a depositado en la cuenta destino. — Ejemplo: `3680` |
| ↳ `accountbank_rut` | string |  | Rut del titular de la cuenta destino. — Ejemplo: `V23654789` |
| ↳ `accountbank_name` | string |  | Nombre del titular de la cuenta destino. — Ejemplo: `test` |
| ↳ `accountbank_type` | integer |  | Tipo de cuenta del banco destino. — Ejemplo: `1` |
| ↳ `accountbank_num` | integer |  | Número de cuenta del banco destino. — Ejemplo: `123123123` |
| ↳ `accountbank_sbif` | string |  | Código del banco al que pertenece la cuenta bancaria. — Ejemplo: `0102` |
| ↳ `status` | string |  | Estatus del movimiento. - pending ("payout registrado") - processing ("payout en proceso de pago") - success ("payout depositado exitosamente") - banking_error ("payout rechazado por el banco") - fraud_prevention ("payout rechazado por compliance") — Ejemplo: `pending` |
| ↳ `update_at` | string |  | Fecha que se realizo la solicitud. — Ejemplo: `2023-06-09 21:10:46` |
| ↳ `origin_wallet` | string |  | Id de la wallet origen. — Ejemplo: `wa1933f37cdaf7d1c6` |
| ↳ `reason_rejection` | string |  | Motivo del rechazo. — Ejemplo: `Error CCA 51. Cuenta Beneficiario no Existe, error_creditor_account_not_found` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "subject:invalid,amount:is empty,email:is empty,order:invalid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `subject:invalid,amount:is empty,email:is empty,order:invalid` |

*404* — Identificador no existe.

```json
{
  "status": "failed",
  "type": "Not Found",
  "id": "is not valid"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Not Found` |
| `id` | string |  | Información de id — Ejemplo: `is not valid` |

## Bancos

Permite ver la lista de los bancos asociados.

### Obtener lista de bancos por el tipo de moneda

`GET /api/banks?currency=ves`

Este método permite obtener una lista de los bancos asociados filtrados por la moneda.
Para filtrar por la moneda, hay que agregar el query params currency con el valor de la moneda.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/banks?currency=ves  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/banks?currency=ves', [
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/banks?currency=ves', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  const result = await response.json();
  console.log(result)
}
request();
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "banks": [
    {
      "code": "0102",
      "name": "Banco de Venezuela",
      "currency": "VES"
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus del endpoint. Los posibles estados que puede obtener son los siguientes: - success — Ejemplo: `success` |
| `banks` | array of objects |  | Ejemplo: `[{"code":"0102","name":"Banco de Venezuela","currency":"VES"}]` |
| ↳ `code` | string |  | Código del banco al que pertenece la cuenta bancaria. — Ejemplo: `Banco de Venezuela` |
| ↳ `name` | string |  | Nombre de la entidad bancaria. — Ejemplo: `Banco de Venezuela` |
| ↳ `currency` | string |  | Moneda — Ejemplo: `VES` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "Hay un problema con tu request"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `Hay un problema con tu request` |

## Métodos de pago

Permite ver la lista de los métodos de pago utilizados por payku.

### Obtener lista de métodos de pago por el tipo de moneda

`GET /api/paymentmethods?currency=ves`

Este método permite obtener una lista de los métodos de pago en payku.
Para filtrar por la moneda, hay que agregar el query params currency con el valor de la moneda.

**CURL**

```text
curl -X GET \
https://BASE-URL/api/paymentmethods?currency=ves  \
-H 'Accept: application/json, text/plain, */*' \
-H 'Content-Type: application/json' \
-H 'Host: BASE-URL' \
```

**PHP**

```php
$client = new \GuzzleHttp\Client();
  $body = $client->request('GET', 'https://BASE_URL/api/paymentmethods?currency=ves', [
  ])->getBody();
$response = json_decode($body);
```

**JS**

```js
const request = async () => {
  const response = await fetch('https://BASE_URL/api/paymentmethods?currency=ves', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  const result = await response.json();
  console.log(result)
}
request();
```

**Respuestas**

*200*

```json
{
  "status": "success",
  "payment_methods": [
    {
      "currency": "VES",
      "payment": 17,
      "name": "Vepuy",
      "description": "Utiliza tu banco, simplifica tus transferencias."
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus del endpoint. Los posibles estados que puede obtener son los siguientes: - success — Ejemplo: `success` |
| `payment_methods` | array of objects |  | Ejemplo: `[{"currency":"VES","payment":17,"name":"Vepuy","description":"Utiliza tu banco, simplifica tus transferencias."}]` |
| ↳ `code` | string |  | Código del banco al que pertenece la cuenta bancaria. — Ejemplo: `Banco de Venezuela` |
| ↳ `name` | string |  | Nombre de la entidad bancaria. — Ejemplo: `Banco de Venezuela` |
| ↳ `currency` | string |  | Moneda — Ejemplo: `VES` |

*400* — Error en la solicitud.

```json
{
  "status": "failed",
  "type": "Unprocessable Entity",
  "message_error": "Hay un problema con tu request"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | string |  | Estatus de la solicitud. — Ejemplo: `failed` |
| `type` | string |  | Tipo de error ocurrido. — Ejemplo: `Unprocessable Entity` |
| `message_error` | string |  | Mensaje de error — Ejemplo: `Hay un problema con tu request` |
