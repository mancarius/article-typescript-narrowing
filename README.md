Chi utilizza TypeScript avrà sicuramente apprezzato la sua capacità di individuare prematuramente potenziali bug nel codice, grazie alla deduzione automatica dei tipi delle variabili o delle funzioni in base al flusso del codice. Questa potente funzionalità, chiamata type narrowing, spesso opera dietro le quinte senza che ce ne accorgiamo.

#### Un Esempio Pratico

Immaginiamo il seguente scenario:

```typescript
function print(strs: string | string[]): string {
  if (strs && typeof strs === 'object') {
    console.log(strs.join(' '));
  } else {
    console.log(strs);
  }
}
```

Se TypeScript non fosse in grado di restringere i tipi, si verificherebbe un errore nello statement `if` in quanto, se l'argomento `strs` fosse una stringa non sarebbe possibile chiamare il metodo `join()`.

Grazie al type narrowing, invece, TypeScript capisce che all'interno dell'`if`, `strs` è un array di stringhe, permettendo così la chiamata al metodo `join()` senza problemi.

#### Gestione dello Stato di una Richiesta HTTP

Vediamo ora un esempio più complesso. Supponiamo di star lavorando su un'applicazione frontend e di voler tracciare lo stato di una richiesta HTTP all'interno del nostro store. Abbiamo i classici stati: `idle`, `pending`, `success` ed `error`. Per quest'ultimo vogliamo salvare il messaggio di errore al posto della semplice descrizione dello stato.
Definiamo i tipi come segue:

```typescript
enum RequestStatusEnum {
  IDLE = "idle",
  PENDING = "pending",
  SUCCESS = "success",
  ERROR = "error",
}

type RequestStatus =
  | RequestStatusEnum.IDLE
  | RequestStatusEnum.PENDING
  | RequestStatusEnum.SUCCESS
  | { error: string };
```

Guardando la definizione del tipo `RequestStatus` potremmo chiederci come potremo andare ad identificare lo stato della richiesta senza fare giri eccessivamente complessi.
In effetti, come vediamo nell'esempio che segue, verificare lo stato di una richiesta potrebbe diventare prolisso con questa struttura, dovendo fare un doppio controllo ad ogni verifica per aiutare TypeScript a restringere i tipi e non bloccarci nella compilazione.

```typescript
let requestStatus: RequestStatus;

// ... codice ...

if (typeof requestStatus === "string" && requestStatus === RequestStatusEnum.SUCCESS) {
  console.log("Richiesta completata!");
}

if (typeof requestStatus === "object" && "error" in requestStatus) {
  console.error('Richiesta fallita:', requestStatus.error);
}
```

Questo codice funziona, ma ripetere questi controlli in tutta l'applicazione è sia prolisso che difficile da mantenere.

#### Migliorare con una Funzione di Supporto

Proviamo allora ad implementare una funzione che ci aiuti a gestire il ritorno dello stato della richiesta corrispondente.

```typescript
function getRequestStatus<T extends RequestStatus>(
  status: T
): RequestStatusEnum.ERROR | T {
  if (typeof status === "object" && "error" in status) {
    return RequestStatusEnum.ERROR;
  }
  return status;
}
```

Utilizzando questa funzione, possiamo riscrivere il nostro codice precedente:

```typescript
let requestStatus: RequestStatus;

// ... codice ...

if (getRequestStatus(requestStatus) === RequestStatusEnum.SUCCESS) {
  console.log("Richiesta completata!");
}

if (getRequestStatus(requestStatus) === RequestStatusEnum.ERROR) {
  console.error('Richiesta fallita:', requestStatus.error);  // KO!
}
```

Tuttavia, TypeScript ha ancora difficoltà a dedurre il tipo di `requestStatus` dopo aver verificato il suo stato. Per noi è logico che se `getRequestStatus` ritorna `RequestStatusEnum.ERROR`, `requestStatus` contiene un oggetto con una proprietà `error`, ma TypeScript vede `requestStatus` ancora come un tipo `RequestStatus`, che può contenere anche stringhe.

#### Utilizzare le Type Assertions

Una soluzione potrebbe essere quella di suggerire esplicitamente a TypeScript il tipo della variabile tramite la type assertion.

```typescript
if (getRequestStatus(requestStatus) === RequestStatusEnum.ERROR) {
  console.error(
    'Richiesta fallita:',
    (requestStatus as Extract<RequestStatus, { error: string }>).error
  );
}
```

TypeScript accetta questo suggerimento, ma questa soluzione rende il codice meno leggibile, meno robusto e viola il principio DRY (Don't Repeat Yourself), poiché dovremmo ripetere questa assertion ogni volta che controlliamo lo stato di una richiesta.

#### Un'Approccio Migliore: Type Guards e Conditional Types

L'ideale sarebbe lasciare a TypeScript il compito di dedurre il tipo corretto. Per metterlo in condizione di fare questo possiamo usare un type predicate.

```typescript
function isRequestStatusError(
  requestStatus: RequestStatus
): requestStatus is Extract<RequestStatus, { error: string }> {
  return getRequestStatus(requestStatus) === RequestStatusEnum.ERROR;
}

if (isRequestStatusError(requestStatus)) {
  console.error('Richiesta fallita:', requestStatus.error); // OK
}
```

Problema risolto!

Abbiamo scritto una funzione che ci permette verificare lo stato di una richiesta in modo coinciso e più elegante all'interno della nostra applicazione e, al contempo, di mettere Typescript in condizione di dedurre correttamente il tipo di stato contenuto in `requestStatus` nel caso in cui sia un errore.

Ora, scriviamo una funzione per ogni altro possibile stato della richiesta.

```typescript
function isRequestStatusIdle(
  requestStatus: RequestStatus
): requestStatus is Extract<RequestStatus, RequestStatusEnum.IDLE> {
  return getRequestStatus(requestStatus) === RequestStatusEnum.IDLE;
}

function isRequestStatusPending(
  requestStatus: RequestStatus
): requestStatus is Extract<RequestStatus, RequestStatusEnum.PENDING> {
  return getRequestStatus(requestStatus) === RequestStatusEnum.PENDING;
}

function isRequestStatusSuccess(
  requestStatus: RequestStatus
): requestStatus is Extract<RequestStatus, RequestStatusEnum.SUCCESS> {
  return getRequestStatus(requestStatus) === RequestStatusEnum.SUCCESS;
}
```

Questa soluzione è migliore, certo, ma ancora non convincente. Abbiamo creato una funzione specificha per ogni stato, quindi ogni funzione è fortemente accoppiata al suo stato e quindi poco flessibile. Se dovessimo modificare gli stati o la logica di verifica, dovremmo aggiornare ogni funzione. Inoltre abbiamo quattro nuove funzioni da ricordare, il che può sembrare banale, ma può diventare tutt'altro che scontato in applicazioni di grandi dimensioni con decine o forse centinaia di metodi, classi, costanti, tipi, ecc..

#### Combinare Type Guards e Conditional Types

Possiamo ridurre il numero di funzioni necessarie a una sola?
Sì, possiamo farlo combinando altri strumenti che il buon Typescript ci mette a disposizione; i type predicate ed i conditional types.

Andiamo a crearla:

```typescript
export function isRequestStatus<
  R extends RequestStatus,
  S extends RequestStatusEnum
>(
  requestStatus: R,
  status: S
): requestStatus is R &
  (S extends RequestStatusEnum.ERROR
    ? { error: string }
    : S) {
  return getRequestStatus(requestStatus) === status;
}
```

La funzione `isRequestStatus` verifica se lo stato della richiesta corrisponde a quello specificato e permette a TypeScript di effettuare il type narrowing correttamente.

Riscriviamo il nostro codice iniziale utilizzando questa nuova funzione.

```typescript
if (isRequestStatus(requestStatus, RequestStatusEnum.SUCCESS)) {
  console.error('Richiesta fallita:', requestStatus.error); // KO
}

if (isRequestStatus(requestStatus, RequestStatusEnum.ERROR)) {
  console.error('Richiesta fallita:', requestStatus.error); // OK
}
```

Perfetto! Ora abbiamo una sola funzione tipizzata, leggibile, scalabile e manutenibile per la verifica dello stato.

#### Conclusione

In questo articolo, abbiamo esplorato come migliorare la gestione dello stato delle richieste HTTP in TypeScript utilizzando type guards e conditional types. Implementando queste tecniche, possiamo rendere il nostro codice più robusto e facile da mantenere, migliorando allo stesso tempo la sicurezza dei tipi. Ricordiamoci sempre che un buon uso dei tipi può fare la differenza tra un codice di qualità e ore spese a cercare bug difficili da individuare.
