import { useCart } from './CartContext';
import { CartIcon } from '../icons/CartIcon';
import './CartButton.css';

interface Props {
  onClick: () => void;
}

export function CartButton({ onClick }: Props) {
  const { count } = useCart();

  return (
    <button className="cart-button" onClick={onClick} aria-label="Open cart">
      <CartIcon />
      {count > 0 && <span className="cart-button__badge">{count}</span>}
    </button>
  );
}
