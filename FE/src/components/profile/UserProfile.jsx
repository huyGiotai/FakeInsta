import { useEffect, memo } from "react"; // Bỏ `useState` không cần thiết
import { useSelector, useDispatch } from "react-redux";
import { getUserAction } from "../../redux/actions/userActions";
import PostOnProfile from "../post/PostOnProfile";
import OwnProfileCard from "./OwnProfileCard";
import CommonLoading from "../loader/CommonLoading";
import OwnInfoCard from "./OwnInfoCard";
import NoPost from "../../assets/nopost.jpg";

const UserProfile = ({ userData }) => {
  const dispatch = useDispatch();

  // --- SỬA ĐỔI 1: LẤY TRẠNG THÁI `loading` TRỰC TIẾP TỪ REDUX ---
  // Bỏ state `loading` cục bộ và lấy cả `user` và `loading` từ store
  const { user, loading } = useSelector((state) => state.user);
  const posts = user?.posts;

  useEffect(() => {
    // --- SỬA ĐỔI 2: ĐƠN GIẢN HÓA `useEffect` ---
    // Chỉ cần dispatch action. Component sẽ tự động re-render khi
    // `loading` hoặc `user` trong Redux thay đổi.
    if (userData?._id) {
      dispatch(getUserAction(userData._id));
    }
  }, [dispatch, userData?._id]);

  const MemoizedPostOnProfile = memo(PostOnProfile);

  let postToShow;

  postToShow = posts?.map((post) => (
    <MemoizedPostOnProfile key={post._id} post={post} />
  ));

  // --- SỬA ĐỔI 3: SỬ DỤNG `loading` TỪ REDUX ĐỂ HIỂN THỊ GIAO DIỆN ---
  return (
    <>
      {loading || !user?.posts ? ( // Dùng `loading` từ Redux
        <div className="flex justify-center items-center h-screen">
          <CommonLoading />
        </div>
      ) : (
        <>
          <OwnProfileCard user={user} />
          <OwnInfoCard user={user} />

          <h3 className="font-semibold text-center mb-4 text-gray-700 p-3 border-b">
            Your most recent posts
          </h3>

          {postToShow?.length === 0 ? (
            <div className="text-center text-gray-700 flex justify-center items-center flex-col">
              <p className="font-semibold py-5 text-gray-500">
                You haven't posted anything yet
              </p>
              <img
                className="max-w-md rounded-full"
                src={NoPost}
                alt="no post"
              />
            </div>
          ) : (
            postToShow
          )}
        </>
      )}
    </>
  );
};

export default UserProfile;