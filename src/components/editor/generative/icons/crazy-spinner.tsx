const CrazySpinner = () => {
    return (
        <div className="flex items-center justify-center space-x-0.5">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500"
                    style={{
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: "0.6s",
                    }}
                />
            ))}
        </div>
    );
};

export default CrazySpinner;
