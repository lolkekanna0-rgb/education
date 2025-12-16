import { BehaviorSubject } from "rxjs";

type TopUpModalState = {
  open: boolean;
};

const topUpModal$ = new BehaviorSubject<TopUpModalState>({ open: false });

const openTopUpModal = () => {
  topUpModal$.next({ open: true });
};

const closeTopUpModal = () => {
  topUpModal$.next({ open: false });
};

export { topUpModal$, openTopUpModal, closeTopUpModal };
