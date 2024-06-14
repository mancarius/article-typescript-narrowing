/**
 * Enumerazione che rappresenta lo stato di una richiesta.
 */
export enum RequestStatusEnum {
  /**
   * Stato iniziale della richiesta.
   *
   * Indica che la richiesta non è stata ancora effettuata.
   */
  IDLE = 'idle',
  /**
   * Stato di attesa della richiesta.
   *
   * Indica che la richiesta è in corso.
   */
  PENDING = 'pending',
  /**
   * Stato di successo della richiesta.
   *
   * Indica che la richiesta è stata completata con successo.
   */
  SUCCESS = 'success',
  /**
   * Stato di errore della richiesta.
   *
   * Indica che la richiesta è stata completata con un errore.
   */
  ERROR = 'error',
}

/**
 * Estrae il tipo di RequestStatus corispondente allo stato passato.
 */
export type ExtractRequestStatus<T extends RequestStatusEnum> =
  T extends RequestStatusEnum.ERROR
    ? Extract<RequestStatus, { error: string }>
    : T;

/**
 * Rappresenta lo stato di una richiesta.
 
 * Può essere uno dei seguenti valori: IDLE, PENDING, SUCCESS oppure un oggetto con una proprietà "error" di tipo stringa.
 */
export type RequestStatus =
  | RequestStatusEnum.IDLE
  | RequestStatusEnum.PENDING
  | RequestStatusEnum.SUCCESS
  | { error: string };

/**
 * Restituisce lo stato della richiesta.
 *
 * @param status - Lo stato della richiesta.
 * @returns Lo stato della richiesta o RequestStatusEnum.ERROR se lo stato è un oggetto con una proprietà "error".
 */
export function getRequestStatus<T extends RequestStatus>(status: T) {
  if (typeof status === 'object' && 'error' in status) {
    return RequestStatusEnum.ERROR;
  }
  return status;
}

/**
 * Verifica se lo stato della richiesta corrisponde a quello specificato.
 *
 * @param requestStatus - Lo stato della richiesta.
 * @param status - Lo stato da confrontare.
 * @returns True se lo stato della richiesta corrisponde allo stato specificato, altrimenti False.
 */
export function isRequestStatus<
  R extends RequestStatus,
  S extends RequestStatusEnum
>(requestStatus: R, status: S): requestStatus is R & ExtractRequestStatus<S> {
  return getRequestStatus(requestStatus) === status;
}
