import { RingLoader } from "react-spinners"

const Loader = () => {
    return (
        <div className="absolute left-0 top-0 z-100 w-screen h-screen flex items-center justify-center">
            <RingLoader />
        </div>
    )
}

export default Loader