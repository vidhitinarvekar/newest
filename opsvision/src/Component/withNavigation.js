// withNavigation.js
import { useNavigate } from 'react-router-dom';

function withNavigation(Component) {
  return function WrappedComponent(props) {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  };
}

export default withNavigation;
