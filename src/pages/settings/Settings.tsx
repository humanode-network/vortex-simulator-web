import General from "../General";
import Profile from "../profile/Profile";

const Settings: React.FC = () => {
  return (
    <div className="flex flex-col gap-8">
      <General />
      <Profile showHint={false} />
    </div>
  );
};

export default Settings;
